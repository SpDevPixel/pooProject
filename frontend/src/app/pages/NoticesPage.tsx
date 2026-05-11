/*
 * 파일 위치: src/app/pages/NoticesPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 공지사항 목록을 검색하고 상세 공지로 이동하는 화면입니다.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, Megaphone, Search } from "lucide-react";
import { mockNotices } from "../data/mockNotices";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function NoticesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const notices = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return mockNotices;

    return mockNotices.filter((notice) =>
      [notice.title, notice.content, notice.category].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft size={18} />
            홈으로
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900">공지사항</h1>
            <p className="text-sm text-muted-foreground">서비스 소식과 운영 안내를 확인하세요.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="mb-5 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="공지 제목, 내용, 분류 검색"
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </section>

        <section className="space-y-3">
          {notices.map((notice) => (
            <button
              key={notice.id}
              onClick={() => navigate(`/notices/${notice.id}`)}
              className="w-full rounded-lg border bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {notice.isImportant && (
                  <Badge className="gap-1 bg-red-600">
                    <Megaphone size={13} />
                    중요
                  </Badge>
                )}
                <Badge variant="secondary">{notice.category}</Badge>
                <span className="text-sm text-muted-foreground">{notice.createdAt}</span>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">{notice.title}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{notice.content}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Eye size={14} />
                조회 {notice.viewCount}
                <span>작성자 {notice.author}</span>
              </div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
