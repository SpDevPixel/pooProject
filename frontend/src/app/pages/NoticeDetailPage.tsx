/*
 * 파일 위치: src/app/pages/NoticeDetailPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 선택한 공지사항의 상세 내용을 보여주는 화면입니다.
 */
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Eye, Megaphone, User } from "lucide-react";
import { mockNotices } from "../data/mockNotices";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export default function NoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams();
  const notice = mockNotices.find((item) => item.id === noticeId);

  if (!notice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-lg font-semibold">공지사항을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate("/notices")}>목록으로 돌아가기</Button>
      </div>
    );
  }

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
        <article className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {notice.isImportant && (
              <Badge className="gap-1 bg-red-600">
                <Megaphone size={13} />
                중요
              </Badge>
            )}
            <Badge variant="secondary">{notice.category}</Badge>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-slate-950">{notice.title}</h1>

          <div className="mb-8 flex flex-wrap gap-4 border-b pb-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User size={15} />
              {notice.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={15} />
              {notice.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={15} />
              {notice.viewCount}
            </span>
          </div>

          <p className="whitespace-pre-line leading-7 text-slate-700">{notice.content}</p>
        </article>
      </main>
    </div>
  );
}
