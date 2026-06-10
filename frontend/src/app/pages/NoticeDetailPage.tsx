import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Megaphone, RefreshCw } from "lucide-react";
import { fetchNoticeById } from "../api/notices";
import { Button } from "../components/ui/button";
import type { Notice } from "../types/notice";

export default function NoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotice = async () => {
    if (!noticeId) {
      setNotice(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      setNotice(await fetchNoticeById(noticeId));
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "공지사항을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotice();
  }, [noticeId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/notices")} className="gap-2">
            <ArrowLeft size={18} />
            공지 목록
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {isLoading ? (
          <section className="rounded-lg border bg-white p-12 text-center text-muted-foreground">
            <RefreshCw size={36} className="mx-auto mb-4 animate-spin opacity-40" />
            공지사항을 불러오는 중입니다.
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
            <p className="mb-4">{errorMessage}</p>
            <Button variant="outline" onClick={loadNotice}>
              다시 시도
            </Button>
          </section>
        ) : !notice ? (
          <section className="rounded-lg border bg-white p-12 text-center text-muted-foreground">
            <Megaphone size={44} className="mx-auto mb-4 opacity-30" />
            <p className="mb-4 text-lg font-semibold text-slate-900">공지사항을 찾을 수 없습니다.</p>
            <Button onClick={() => navigate("/notices")}>목록으로 돌아가기</Button>
          </section>
        ) : (
          <article className="rounded-lg border bg-white p-6 shadow-sm">
            {notice.createdAt && (
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={15} />
                {notice.createdAt}
              </div>
            )}

            <h1 className="mb-5 border-b pb-5 text-3xl font-bold text-slate-950">
              {notice.title}
            </h1>

            <p className="whitespace-pre-line leading-7 text-slate-700">
              {notice.content || "내용이 없습니다."}
            </p>
          </article>
        )}
      </main>
    </div>
  );
}
