import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Megaphone,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAdminUsers, forceWithdrawUser, type AdminUser } from "../api/admin";
import { createNotice, deleteNotice, fetchNotices } from "../api/notices";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import type { Notice } from "../types/notice";

type AdminTab = "notices" | "users";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState<AdminTab>("notices");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [noticeQuery, setNoticeQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);
  const [withdrawingUserId, setWithdrawingUserId] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // 공지 목록 조회
  const loadNotices = async () => {
    setIsLoadingNotices(true);
    setNoticeError(null);

    try {
      setNotices(await fetchNotices());
    } catch (error) {
      console.error(error);
      setNoticeError(error instanceof Error ? error.message : "공지사항을 불러오지 못했습니다.");
    } finally {
      setIsLoadingNotices(false);
    }
  };

  // 회원 목록 조회
  const loadUsers = async () => {
    if (!user?.token || !isAdmin) return;

    setIsLoadingUsers(true);
    setUserError(null);

    try {
      setUsers(await fetchAdminUsers(user.token));
    } catch (error) {
      console.error(error);
      setUserError(error instanceof Error ? error.message : "회원 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!isAdmin) return;

    void loadNotices();
    void loadUsers();
  }, [isAdmin, user?.token]);

  // 공지 검색
  const filteredNotices = useMemo(() => {
    const keyword = noticeQuery.trim().toLowerCase();
    if (!keyword) return notices;

    return notices.filter((notice) =>
      [notice.title, notice.content].some((value) => value.toLowerCase().includes(keyword))
    );
  }, [noticeQuery, notices]);

  const filteredUsers = useMemo(() => {
    const keyword = userQuery.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((adminUser) =>
      [
        adminUser.id,
        adminUser.userId,
        adminUser.name,
        adminUser.nickname ?? "",
        adminUser.email,
        adminUser.role,
      ].some((value) => value.toLowerCase().includes(keyword))
    );
  }, [userQuery, users]);

  // 공지 등록
  const handleAddNotice = async () => {
    if (!user?.token || isSubmittingNotice) return;

    const title = noticeTitle.trim();
    const content = noticeContent.trim();

    if (!title || !content) {
      toast.error("공지 제목과 내용을 입력해주세요.");
      return;
    }

    setIsSubmittingNotice(true);

    try {
      const notice = await createNotice(
        {
          title,
          content,
          author: user.name || "관리자",
        },
        user.token
      );

      setNotices((current) => [notice, ...current]);
      setNoticeTitle("");
      setNoticeContent("");
      toast.success("공지사항이 등록되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "공지사항 등록에 실패했습니다.");
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  const handleDeleteNotice = async (notice: Notice) => {
    if (!user?.token || deletingNoticeId) return;

    if (!window.confirm(`"${notice.title}" 공지사항을 삭제할까요?`)) {
      return;
    }

    setDeletingNoticeId(notice.id);

    try {
      await deleteNotice(notice.id, user.token);
      setNotices((current) => current.filter((item) => item.id !== notice.id));
      toast.success("공지사항이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "공지사항 삭제에 실패했습니다.");
    } finally {
      setDeletingNoticeId(null);
    }
  };

  const handleForceWithdrawUser = async (targetUser: AdminUser) => {
    if (!user?.token || withdrawingUserId) return;

    if (targetUser.id === user.id) {
      toast.error("현재 로그인한 관리자 계정은 강제탈퇴할 수 없습니다.");
      return;
    }

    if (!window.confirm(`${targetUser.name || targetUser.userId} 사용자를 강제탈퇴 처리할까요?`)) {
      return;
    }

    setWithdrawingUserId(targetUser.id);

    try {
      await forceWithdrawUser(targetUser.id, user.token);
      setUsers((current) => current.filter((item) => item.id !== targetUser.id));
      toast.success("회원이 강제탈퇴 처리되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "회원 강제탈퇴에 실패했습니다.");
    } finally {
      setWithdrawingUserId(null);
    }
  };

  if (!user) {
    return null;
  }

  // 관리자 권한 안내
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          <Shield size={44} className="mx-auto mb-4 text-slate-400" />
          <h1 className="mb-2 text-xl font-bold text-slate-950">관리자 권한이 필요합니다</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            관리자 계정으로 로그인한 사용자만 접근할 수 있습니다.
          </p>
          <Button onClick={() => navigate("/")}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  // 관리자 콘솔 렌더링
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-white hover:text-slate-950">
            <ArrowLeft size={18} />
            홈으로
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Shield size={22} />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-white">관리자 페이지</h1>
              <p className="text-sm text-slate-300">공지사항과 회원을 관리합니다</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 grid gap-3 md:grid-cols-2">
          <StatPanel icon={Megaphone} label="공지사항" value={notices.length} />
          <StatPanel icon={Users} label="회원" value={users.length} />
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          <AdminTabButton active={activeTab === "notices"} onClick={() => setActiveTab("notices")}>
            공지 관리
          </AdminTabButton>
          <AdminTabButton active={activeTab === "users"} onClick={() => setActiveTab("users")}>
            회원 관리
          </AdminTabButton>
        </div>

        {activeTab === "notices" && (
          <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">새 공지 등록</h2>
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
                  rows={8}
                />
                <Button onClick={handleAddNotice} disabled={isSubmittingNotice} className="w-full">
                  {isSubmittingNotice && <RefreshCw size={16} className="mr-2 animate-spin" />}
                  공지 등록
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <SearchBox
                value={noticeQuery}
                onChange={setNoticeQuery}
                placeholder="공지 제목, 내용, 작성자 검색"
              />
              {noticeError && (
                <ErrorPanel message={noticeError} onRetry={loadNotices} loading={isLoadingNotices} />
              )}
              {isLoadingNotices ? (
                <LoadingPanel message="공지사항을 불러오는 중입니다." />
              ) : filteredNotices.length === 0 ? (
                <EmptyPanel message={noticeQuery.trim() ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."} />
              ) : (
                <div className="space-y-3">
                  {filteredNotices.map((notice) => (
                    <div key={notice.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-950">{notice.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {notice.createdAt || "날짜 없음"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNotice(notice)}
                          disabled={deletingNoticeId === notice.id}
                          aria-label={`${notice.title} 삭제`}
                        >
                          {deletingNoticeId === notice.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} className="text-red-500" />
                          )}
                        </Button>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {notice.content || "내용이 없습니다."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "users" && (
          <section className="space-y-4">
            <SearchBox
              value={userQuery}
              onChange={setUserQuery}
              placeholder="회원 이름, 아이디, 이메일, 권한 검색"
            />
            {userError && <ErrorPanel message={userError} onRetry={loadUsers} loading={isLoadingUsers} />}
            {isLoadingUsers ? (
              <LoadingPanel message="회원 목록을 불러오는 중입니다." />
            ) : filteredUsers.length === 0 ? (
              <EmptyPanel message={userQuery.trim() ? "검색 결과가 없습니다." : "회원이 없습니다."} />
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((adminUser) => (
                  <div key={adminUser.id} className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">
                            {adminUser.name || adminUser.userId || "이름 없음"}
                          </h3>
                          <Badge variant={adminUser.role === "ADMIN" ? "default" : "secondary"}>
                            {adminUser.role}
                          </Badge>
                          {adminUser.id === user.id && <Badge variant="outline">현재 계정</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ID {adminUser.id} · 로그인 ID {adminUser.userId || "-"} · {adminUser.email || "이메일 없음"}
                        </p>
                        {(adminUser.nickname || adminUser.address) && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {adminUser.nickname && `닉네임 ${adminUser.nickname}`}
                            {adminUser.nickname && adminUser.address && " · "}
                            {adminUser.address && `주소 ${adminUser.address}`}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleForceWithdrawUser(adminUser)}
                        disabled={withdrawingUserId === adminUser.id || adminUser.id === user.id}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        {withdrawingUserId === adminUser.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <UserX size={16} />
                        )}
                        강제탈퇴
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function StatPanel({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <Icon size={20} className="text-blue-300" />
      </div>
      <strong className="text-3xl text-white">{value}</strong>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="border-0 px-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-white p-10 text-center text-muted-foreground">
      <RefreshCw size={32} className="mx-auto mb-4 animate-spin opacity-40" />
      {message}
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-white p-10 text-center text-muted-foreground">
      {message}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
  loading,
}: {
  message: string;
  onRetry: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>{message}</span>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
        <RefreshCw size={14} className="mr-2" />
        다시 시도
      </Button>
    </div>
  );
}
