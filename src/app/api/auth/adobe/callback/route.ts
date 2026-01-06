import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // 클라이언트 ID와 시크릿 (환경변수에서 가져옴)
  const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID;
  const clientSecret = process.env.ADOBE_CLIENT_SECRET;

  if (error) {
    return new NextResponse(`
      <script>
        window.opener.postMessage({ type: 'adobe_auth_error', error: '${error}' }, '*');
        window.close();
      </script>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // 1. Adobe 토큰 엔드포인트에 코드를 보내서 Access Token 교환
    const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId || '',
        client_secret: clientSecret || '',
        code: code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to exchange token');
    }

    // 2. 성공 시 부모 창(에디터)에 토큰을 전달하고 팝업 닫기
    return new NextResponse(`
      <html>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f9fafb;">
          <div style="text-align:center;">
            <div style="width:40px;height:40px;border:3px solid #10b981;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
            <h2 style="margin:0;color:#111827;">인증 완료!</h2>
            <p style="color:#6b7280;margin-top:8px;">연동을 마무리하는 중입니다...</p>
          </div>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          <script>
            window.opener.postMessage({ 
              type: 'adobe_auth_success', 
              token: '${data.access_token}' 
            }, '*');
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    console.error('Adobe exchange error:', err);
    return new NextResponse(`
      <script>
        window.opener.postMessage({ type: 'adobe_auth_error', error: '${err.message}' }, '*');
        window.close();
      </script>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}
