
async function inspect() {
  try {
    console.log('Fetching Wanted API...');
    const url = 'https://www.wanted.co.kr/api/v4/jobs?country=kr&tag_type_ids=518&job_sort=job.latest_order&locations=all&years=-1&limit=10';
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    
    const data = await res.json();
    console.log('Success!');
    console.log('Count:', data.data?.length);
    if (data.data?.length > 0) {
      const item = data.data[0];
      console.log('Sample Job:', {
        id: item.id,
        position: item.position,
        company: item.company?.name,
        location: item.address?.location,
        reward: item.reward?.total,
        image: item.title_img?.thumb
      });
    }

  } catch (e) {
    console.error(e);
  }
}

inspect();
