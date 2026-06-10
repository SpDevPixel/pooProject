import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, Megaphone, RefreshCw, Search } from "lucide-react";
import { fetchNotices } from "../api/notices";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Notice } from "../types/notice";

export default function NoticesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotices = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setNotices(await fetchNotices());
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "공지사항을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return notices;

    return notices.filter((notice) =>
      [notice.title, notice.content].some((value) => value.toLowerCase().includes(keyword))
    );
  }, [notices, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft size={18} />
            홈으로
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900">공지사항</h1>
            <p className="text-sm text-muted-foreground">서비스 소식과 운영 안내를 확인하세요</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <section className="mb-5 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="공지 제목, 내용 검색"
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </section>

        {errorMessage && (
          <section className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={loadNotices} disabled={isLoading}>
              <RefreshCw size={14} className="mr-2" />
              다시 시도
            </Button>
          </section>
        )}

        {isLoading ? (
          <section className="rounded-lg border bg-white p-12 text-center text-muted-foreground">
            <RefreshCw size={36} className="mx-auto mb-4 animate-spin opacity-40" />
            공지사항을 불러오는 중입니다.
          </section>
        ) : filteredNotices.length === 0 ? (
          <section className="rounded-lg border bg-white p-12 text-center text-muted-foreground">
            <Megaphone size={44} className="mx-auto mb-4 opacity-30" />
            {query.trim() ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."}
          </section>
        ) : (
          <section className="space-y-3">
            {filteredNotices.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => navigate(`/notices/${notice.id}`)}
                className="w-full rounded-lg border bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                {notice.createdAt && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={15} />
                    {notice.createdAt}
                  </div>
                )}
                <h2 className="mb-2 text-lg font-semibold text-slate-900">{notice.title}</h2>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {notice.content || "내용이 없습니다."}
                </p>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
