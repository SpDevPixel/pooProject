/*
 * 파일 위치: src/app/pages/AdminPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 공지, 회원, 등록 요청을 임시 데이터로 관리하는 관리자 화면입니다.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { mockNotices } from "../data/mockNotices";
import { mockToilets } from "../data/mockToilets";
import { MockUser, mockUsers } from "../data/mockUsers";
import { Notice } from "../types/notice";
import { Toilet } from "../types/toilet";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

type AdminTab = "notices" | "toilets" | "users";
type RequestStatus = "대기" | "승인" | "반려";

interface ToiletRequest {
  toilet: Toilet;
  status: RequestStatus;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("notices");
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [requests, setRequests] = useState<ToiletRequest[]>(
    mockToilets
      .filter((toilet) => toilet.isUserSubmitted)
      .map((toilet) => ({ toilet, status: "대기" }))
  );
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");

  const stats = useMemo(
    () => [
      { label: "공지", value: notices.length, icon: Megaphone },
      { label: "등록 요청", value: requests.filter((item) => item.status === "대기").length, icon: ClipboardList },
      { label: "회원", value: users.length, icon: Users },
    ],
    [notices.length, requests, users.length]
  );

  const addNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      category: "안내",
      author: "관리자",
      createdAt: new Date().toISOString().slice(0, 10),
      viewCount: 0,
      isImportant: false,
    };

    setNotices((current) => [newNotice, ...current]);
    setNoticeTitle("");
    setNoticeContent("");
  };

  const updateRequestStatus = (toiletId: string, status: RequestStatus) => {
    setRequests((current) =>
      current.map((item) => (item.toilet.id === toiletId ? { ...item, status } : item))
    );
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, status: user.status === "활성" ? "정지" : "활성" } : user
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-white hover:text-slate-900">
            <ArrowLeft size={18} />
            홈으로
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">관리자 페이지</h1>
              <p className="text-sm text-slate-300">백엔드 연결 전 임시 운영 화면</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 grid gap-3 md:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">{label}</span>
                <Icon size={20} className="text-blue-300" />
              </div>
              <strong className="text-3xl">{value}</strong>
            </div>
          ))}
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          <AdminTabButton active={activeTab === "notices"} onClick={() => setActiveTab("notices")}>
            공지 관리
          </AdminTabButton>
          <AdminTabButton active={activeTab === "toilets"} onClick={() => setActiveTab("toilets")}>
            등록 요청
          </AdminTabButton>
          <AdminTabButton active={activeTab === "users"} onClick={() => setActiveTab("users")}>
            회원 관리
          </AdminTabButton>
        </div>

        {activeTab === "notices" && (
          <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <div className="rounded-lg border border-white/10 bg-white p-5 text-slate-950">
              <h2 className="mb-4 font-semibold">새 공지 작성</h2>
              <div className="space-y-3">
                <Input
                  value={noticeTitle}
                  onChange={(event) => setNoticeTitle(event.target.value)}
                  placeholder="공지 제목"
                />
                <Textarea
                  value={noticeContent}
                  onChange={(event) => setNoticeContent(event.target.value)}
                  placeholder="공지 내용"
                  rows={7}
                />
                <Button onClick={addNotice} className="w-full">공지 등록</Button>
              </div>
            </div>

            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="rounded-lg border border-white/10 bg-white p-4 text-slate-950">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{notice.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{notice.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "toilets" && (
          <section className="space-y-3">
            {requests.map(({ toilet, status }) => (
              <div key={toilet.id} className="rounded-lg border border-white/10 bg-white p-5 text-slate-950">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold">{toilet.name}</h3>
                      <Badge variant={status === "승인" ? "default" : "secondary"}>{status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{toilet.roadAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateRequestStatus(toilet.id, "승인")} className="gap-2">
                      <CheckCircle2 size={16} />
                      승인
                    </Button>
                    <Button variant="outline" onClick={() => updateRequestStatus(toilet.id, "반려")} className="gap-2">
                      <XCircle size={16} />
                      반려
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === "users" && (
          <section className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-white/10 bg-white p-5 text-slate-950">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <Badge variant={user.role === "관리자" ? "default" : "secondary"}>{user.role}</Badge>
                      <Badge variant={user.status === "활성" ? "secondary" : "destructive"}>{user.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.email} · 가입일 {user.joinedAt} · 리뷰 {user.reviewCount}개
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toggleUserStatus(user.id)}>
                    {user.status === "활성" ? "정지" : "활성화"}
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function AdminTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        active ? "bg-white text-slate-950" : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}
