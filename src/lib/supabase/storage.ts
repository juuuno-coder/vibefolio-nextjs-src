// src/lib/supabase/storage.ts
// Supabase Storage 이미지 업로드 유틸리티

import { supabase } from './client';

/**
 * 이미지를 Supabase Storage에 업로드
 * @param file - 업로드할 파일
 * @param bucket - 버킷 이름 (기본값: 'project-images')
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImage(
  file: File,
  bucket: string = 'projects'
): Promise<string> {
  try {
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop();
    // 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('이미지 업로드 실패:', error);
      // 에러 메시지 상세화
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    // 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
}

/**
 * Supabase Storage에서 이미지 삭제
 * @param imageUrl - 삭제할 이미지 URL
 * @param bucket - 버킷 이름 (기본값: 'project-images')
 */
export async function deleteImage(
  imageUrl: string,
  bucket: string = 'projects'
): Promise<void> {
  try {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('uploads')).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('이미지 삭제 실패:', error);
      throw new Error('이미지 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    throw error;
  }
}

/**
 * Base64 이미지를 File 객체로 변환
 * @param base64 - Base64 문자열
 * @param filename - 파일명
 * @returns File 객체
 */
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * 외부 URL 이미지를 다운로드하여 Supabase Storage에 업로드
 * @param url - 외부 이미지 URL
 * @param bucket - 버킷 이름
 * @returns 업로드된 내부 이미지 URL
 */
export async function uploadImageFromUrl(
  url: string,
  bucket: string = 'projects'
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image from URL');
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 파일 확장자 추출
    const urlPath = new URL(url).pathname;
    const fileExt = urlPath.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image proxy upload failed:', error);
    return url; // 실패 시 원본 URL 반환 (graceful fallback)
  }
}
