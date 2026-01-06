import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID;

  try {
    // 1. 사용자 계정 정보에서 Catalog ID 가져오기
    const accountRes = await fetch('https://lr.adobe.io/v2/account', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': clientId || '',
      },
    });

    if (!accountRes.ok) throw new Error('Failed to fetch account info');
    const accountData = await accountRes.json();
    const catalogId = accountData.base; // 'base' 필드에 catalog id가 들어있음

    // 2. 해당 카탈로그의 최근 사진(Assets) 목록 가져오기
    const assetsRes = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/assets?limit=40`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': clientId || '',
      },
    });

    if (!assetsRes.ok) throw new Error('Failed to fetch assets');
    const assetsData = await assetsRes.json();

    // 3. 에디터 UI에 맞는 형식으로 변환
    // Lightroom 에셋은 직접적인 이미지 URL 대신 rendition URL을 조합해야 함
    const photos = (assetsData.resources || []).map((asset: any) => {
      const assetId = asset.id;
      // 썸네일 및 원본 버전의 Rendition URL 구성
      // 실제 구현 시에는 Adobe의 정책에 맞게 서명된 URL이나 프록시를 사용할 수 있음
      const baseUrl = `https://lr.adobe.io/v2/catalogs/${catalogId}/assets/${assetId}/renditions`;
      
      return {
        id: assetId,
        // 2k 해상도 이미지
        url: `${baseUrl}/2k?api_key=${clientId}&bearer_token=${token}`,
        // 썸네일 이미지
        thumbnail: `${baseUrl}/thumbnail2x?api_key=${clientId}&bearer_token=${token}`,
        title: asset.payload?.importSource?.fileName || 'Lightroom Photo',
      };
    });

    return NextResponse.json({ photos });

  } catch (err: any) {
    console.error('Lightroom photos error:', err);
    return NextResponse.json({ 
      error: err.message,
      // API 연동이 처음이거나 실패할 경우를 대비해 안내 메시지 포함
      message: 'Lightroom API 접근 권한을 확인해 주세요.'
    }, { status: 500 });
  }
}
