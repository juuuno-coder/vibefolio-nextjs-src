import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // Updated import
import { ImageCard } from '@/components/ImageCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MapPin, Link as LinkIcon, Calendar, Github, Twitter, Instagram, Globe, Lock } from 'lucide-react'; // Added Lock
import Image from 'next/image';

// 예약된 경로 제외 (혹시 모를 충돌 방지)
const RESERVED_ROUTES = ['admin', 'api', 'login', 'signup', 'mypage', 'auth', 'project', 'recruit', 'robots.txt', 'sitemap.xml'];

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio, avatar_url, cover_image_url, is_public')
    .eq('username', params.username)
    .single();

  if (!profile) return { title: 'User not found' };

  if (profile.is_public === false) {
      return { title: '비공개 프로필' };
  }

  return {
    title: `${profile.username} | Vibefolio`,
    description: profile.bio || `${profile.username}님의 포트폴리오입니다.`,
    openGraph: {
      images: [profile.cover_image_url || profile.avatar_url || '/og-image.png'],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = params;
  const supabase = createClient();

  // 예약된 경로 체크
  if (RESERVED_ROUTES.includes(username)) {
    notFound();
  }
  
  // 현재 로그인한 사용자 확인 (본인 확인용)
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 프로필 정보 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      users:id (email, nickname) 
    `) 
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // 비공개 프로필 접근 제어
  const isOwner = user?.id === profile.id;
  if (profile.is_public === false && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">비공개 프로필입니다</h1>
            <p className="text-gray-500 mb-8">
                이 사용자의 프로필은 비공개로 설정되어 있습니다.<br/>
                프로필 소유자만 볼 수 있습니다.
            </p>
            <Link href="/">
                <Button className="w-full">메인으로 돌아가기</Button>
            </Link>
        </div>
      </div>
    );
  }

  // 2. 프로젝트 목록 조회 (공개된 것만)
  const { data: projects } = await supabase
    .from('Project')
    .select(`
      *,
      profiles (username, avatar_url),
      project_images (image_url),
      like (count),
      comment (count),
      view (count),
      bookmark (count)
    `)
    .eq('creator_id', profile.id)
    .eq('visibility', 'public') // 공개 프로젝트만
    .order('created_at', { ascending: false });

  // 3. 통계 데이터 (좋아요 받은 수 등) - 간단히 계산
  const totalLikes = projects?.reduce((acc, curr) => acc + (curr.like?.[0]?.count || 0), 0) || 0;
  const totalViews = projects?.reduce((acc, curr) => acc + (curr.view?.[0]?.count || 0), 0) || 0;

  // 소셜 링크 파싱
  const socialLinks = profile.social_links as Record<string, string> || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 커버 이미지 */}
      <div className="h-60 md:h-80 w-full relative bg-gray-200">
        {profile.cover_image_url ? (
          <Image
            src={profile.cover_image_url}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 sm:-mt-32 mb-6">
          {/* 아바타 */}
          <div className="relative inline-block">
             <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white relative">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                  {(profile.username?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            {/* 온라인 상태 표시 (임시) */}
            <div className="absolute bottom-4 right-4 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
          </div>
          
          {/* 프로필 정보 & 액션 버튼 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.users?.nickname || profile.username}
              </h1>
              <p className="text-gray-500 font-medium">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-gray-700 mt-3 max-w-2xl text-lg leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {profile.users?.email && (
                  <div className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>{profile.users.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(profile.created_at || Date.now()).toLocaleDateString()} 가입</span>
                </div>
                {/* 소셜 링크 */}
                {Object.entries(socialLinks).map(([key, url]) => {
                    if (!url) return null;
                    let icon = <Globe className="w-4 h-4" />;
                    if (key === 'github') icon = <Github className="w-4 h-4" />;
                    if (key === 'twitter') icon = <Twitter className="w-4 h-4" />;
                    if (key === 'instagram') icon = <Instagram className="w-4 h-4" />;
                    
                    return (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                            {icon}
                        </a>
                    );
                })}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button className="flex-1 md:flex-none bg-black hover:bg-gray-800 text-white font-bold rounded-full px-6">
                팔로우(준비중)
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none rounded-full border-gray-300">
                메시지
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <LinkIcon className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Projects</p>
                <p className="text-2xl font-black text-gray-900">{projects?.length || 0}</p>
            </div>
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Total Likes</p>
                <p className="text-2xl font-black text-gray-900">{totalLikes.toLocaleString()}</p>
            </div>
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Total Views</p>
                <p className="text-2xl font-black text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Followers</p>
                <p className="text-2xl font-black text-gray-900">-</p>
            </div>
        </div>

        {/* 탭 콘텐츠 */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger 
              value="projects" 
              className="px-6 py-3 rounded-none text-base font-medium text-gray-500 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent"
            >
              프로젝트 ({projects?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="collections" 
              className="px-6 py-3 rounded-none text-base font-medium text-gray-500 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent"
            >
              컬렉션
            </TabsTrigger>
             <TabsTrigger 
              value="about" 
              className="px-6 py-3 rounded-none text-base font-medium text-gray-500 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none bg-transparent"
            >
              정보
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-8">
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project: any) => {
                   // ImageCard 형식에 맞게 데이터 변환
                   const cardData = {
                      id: String(project.project_id),
                      title: project.title || '제목 없음',
                      urls: { 
                         full: project.thumbnail_url || '/placeholder.jpg', 
                         regular: project.thumbnail_url || '/placeholder.jpg' 
                      },
                      user: { 
                         username: profile.users?.nickname || profile.username || 'User', 
                         profile_image: { 
                            small: profile.avatar_url || '/globe.svg', 
                            large: profile.avatar_url || '/globe.svg' 
                         } 
                      },
                      likes: project.like?.[0]?.count || 0,
                      views: project.view?.[0]?.count || 0,
                   };

                   return (
                     <Link key={project.project_id} href={`/project/${project.project_id}`}>
                       <ImageCard props={cardData} />
                     </Link>
                   );
                })}
              </div>
            ) : (
                <div className="py-20 text-center">
                    <p className="text-gray-500 text-lg">아직 공개된 프로젝트가 없습니다.</p>
                </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="mt-8">
             <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">컬렉션 기능 준비 중입니다.</p>
             </div>
          </TabsContent>
          
          <TabsContent value="about" className="mt-8">
             <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold mb-4">소개</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profile.bio || "등록된 소개가 없습니다."}
                </p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
