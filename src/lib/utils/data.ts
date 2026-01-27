export function getSafeCustomData(project: any) {
  if (!project) return {};
  
  const customData = project.custom_data;
  if (!customData) return {};

  try {
    if (typeof customData === 'string') {
      return JSON.parse(customData);
    }
    return customData;
  } catch (error) {
    console.error('[Helper] Failed to parse custom_data:', error);
    return {};
  }
}

export function stripHtml(html: string) {
  if (typeof window === 'undefined') return html?.replace(/<[^>]*>?/gm, '') || '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}
