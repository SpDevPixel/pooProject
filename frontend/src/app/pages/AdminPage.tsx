import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  Megaphone,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  approvePendingToilet,
  deleteAdminToilet,
  fetchAdminToilets,
  fetchAdminUsers,
  fetchPendingToilets,
  forceWithdrawUser,
  rejectPendingToilet,
  updateAdminToilet,
  type AdminUser,
} from "../api/admin";
import { createNotice, deleteNotice, fetchNotices } from "../api/notices";
import {
  deleteToiletRequestNotification,
  getToiletRequests,
  type ToiletRequestNotification,
} from "../api/toiletRequests";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import type { Notice } from "../types/notice";
import type { Toilet } from "../types/toilet";

type AdminTab = "approvals" | "toiletManagement" | "updateRequests" | "deleteRequests" | "notices" | "users";

type AdminToiletEditForm = {
  name: string;
  roadAddress: string;
  openTime: string;
  managingOrg: string;
  phoneNumber: string;
  disabledFacility: boolean;
  emergencyBell: boolean;
  diaperTable: boolean;
  entranceCctv: boolean;
  status: string;
};

const toAdminToiletEditForm = (toilet: Toilet): AdminToiletEditForm => ({
  name: toilet.name,
  roadAddress: toilet.roadAddress,
  openTime: toilet.openTime ?? "",
  managingOrg: toilet.managingOrg ?? "",
  phoneNumber: toilet.phoneNumber ?? "",
  disabledFacility: toilet.hasDisabledFacility,
  emergencyBell: toilet.hasEmergencyBell,
  diaperTable: toilet.hasDiaperTable,
  entranceCctv: toilet.hasEntranceCctv,
  status: toilet.status ?? "APPROVED",
});

const getToiletStatusLabel = (status?: string) => {
  if (status === "APPROVED") return "승인";
  if (status === "REJECTED") return "반려";
  return "대기";
};

const getToiletStatusBadgeVariant = (status?: string) => {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "outline";
  return "secondary";
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState<AdminTab>("approvals");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminToilets, setAdminToilets] = useState<Toilet[]>([]);
  const [pendingToilets, setPendingToilets] = useState<Toilet[]>([]);
  const [updateRequests, setUpdateRequests] = useState<ToiletRequestNotification[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<ToiletRequestNotification[]>([]);
  const [toiletQuery, setToiletQuery] = useState("");
  const [noticeQuery, setNoticeQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [toiletEditForm, setToiletEditForm] = useState<AdminToiletEditForm | null>(null);
  const [showAllManagedToilets, setShowAllManagedToilets] = useState(false);
  const [isLoadingAdminToilets, setIsLoadingAdminToilets] = useState(false);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPendingToilets, setIsLoadingPendingToilets] = useState(false);
  const [isLoadingToiletRequests, setIsLoadingToiletRequests] = useState(false);
  const [isSavingToilet, setIsSavingToilet] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);
  const [deletingToiletId, setDeletingToiletId] = useState<number | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [withdrawingUserId, setWithdrawingUserId] = useState<string | null>(null);
  const [processingToiletId, setProcessingToiletId] = useState<number | null>(null);
  const [adminToiletError, setAdminToiletError] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [pendingToiletError, setPendingToiletError] = useState<string | null>(null);
  const [toiletRequestError, setToiletRequestError] = useState<string | null>(null);

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

  // 승인 대기 화장실 목록 조회
  const loadPendingToilets = async () => {
    if (!user?.token || !isAdmin) return;

    setIsLoadingPendingToilets(true);
    setPendingToiletError(null);

    try {
      setPendingToilets(await fetchPendingToilets(user.token));
    } catch (error) {
      console.error(error);
      setPendingToiletError(error instanceof Error ? error.message : "승인 대기 화장실을 불러오지 못했습니다.");
    } finally {
      setIsLoadingPendingToilets(false);
    }
  };

  // 전체 화장실 목록 조회
  const loadAdminToilets = async () => {
    if (!user?.token || !isAdmin) return;

    setIsLoadingAdminToilets(true);
    setAdminToiletError(null);

    try {
      setAdminToilets(await fetchAdminToilets(user.token));
    } catch (error) {
      console.error(error);
      setAdminToiletError(error instanceof Error ? error.message : "전체 화장실 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoadingAdminToilets(false);
    }
  };

  // 관리자에게 온 화장실 수정/삭제 요청 조회
  const loadToiletRequests = async () => {
    if (!user?.token || !isAdmin) return;

    setIsLoadingToiletRequests(true);
    setToiletRequestError(null);

    try {
      const requests = await getToiletRequests(user.token);
      setUpdateRequests(requests.filter((request) => request.type === "UPDATE"));
      setDeleteRequests(requests.filter((request) => request.type === "DELETE"));
    } catch (error) {
      console.error(error);
      setToiletRequestError(error instanceof Error ? error.message : "화장실 요청을 불러오지 못했습니다.");
    } finally {
      setIsLoadingToiletRequests(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!isAdmin) return;

    void loadPendingToilets();
    void loadAdminToilets();
    void loadToiletRequests();
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

  const filteredAdminToilets = useMemo(() => {
    const keyword = toiletQuery.trim().toLowerCase();
    if (!keyword) return adminToilets;

    return adminToilets.filter((toilet) =>
      [
        toilet.name,
        toilet.roadAddress,
        toilet.managementNo,
        toilet.managingOrg ?? "",
        toilet.phoneNumber ?? "",
        toilet.status ?? "",
        toilet.isUserSubmitted ? "사용자 등록" : "공공데이터",
      ].some((value) => value.toLowerCase().includes(keyword))
    );
  }, [adminToilets, toiletQuery]);

  const visibleAdminToilets = showAllManagedToilets
    ? filteredAdminToilets
    : filteredAdminToilets.slice(0, 50);

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

  const handleApproveToilet = async (toilet: Toilet) => {
    if (!user?.token || processingToiletId || !toilet.backendId) return;

    setProcessingToiletId(toilet.backendId);

    try {
      await approvePendingToilet(toilet.backendId, user.token);
      setPendingToilets((current) => current.filter((item) => item.backendId !== toilet.backendId));
      setAdminToilets((current) =>
        current.map((item) =>
          item.backendId === toilet.backendId ? { ...item, status: "APPROVED" } : item
        )
      );
      toast.success("화장실 등록이 승인되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "화장실 승인에 실패했습니다.");
    } finally {
      setProcessingToiletId(null);
    }
  };

  const handleRejectToilet = async (toilet: Toilet) => {
    if (!user?.token || processingToiletId || !toilet.backendId) return;

    if (!window.confirm(`"${toilet.name}" 등록 요청을 반려할까요?`)) {
      return;
    }

    setProcessingToiletId(toilet.backendId);

    try {
      await rejectPendingToilet(toilet.backendId, user.token);
      setPendingToilets((current) => current.filter((item) => item.backendId !== toilet.backendId));
      setAdminToilets((current) =>
        current.map((item) =>
          item.backendId === toilet.backendId ? { ...item, status: "REJECTED" } : item
        )
      );
      toast.success("화장실 등록이 반려되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "화장실 반려에 실패했습니다.");
    } finally {
      setProcessingToiletId(null);
    }
  };

  const handleOpenToiletEdit = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    setToiletEditForm(toAdminToiletEditForm(toilet));
  };

  const handleCloseToiletEdit = () => {
    if (isSavingToilet) return;
    setSelectedToilet(null);
    setToiletEditForm(null);
  };

  const handleSaveManagedToilet = async () => {
    if (!user?.token || !selectedToilet?.backendId || !toiletEditForm || isSavingToilet) return;

    const name = toiletEditForm.name.trim();
    const roadAddress = toiletEditForm.roadAddress.trim();

    if (!name || !roadAddress) {
      toast.error("화장실 이름과 주소를 입력해주세요.");
      return;
    }

    setIsSavingToilet(true);

    try {
      await updateAdminToilet(
        selectedToilet.backendId,
        {
          name,
          roadAddress,
          openTime: toiletEditForm.openTime,
          managingOrg: toiletEditForm.managingOrg,
          phoneNumber: toiletEditForm.phoneNumber,
          disabledFacility: toiletEditForm.disabledFacility,
          emergencyBell: toiletEditForm.emergencyBell,
          diaperTable: toiletEditForm.diaperTable,
          entranceCctv: toiletEditForm.entranceCctv,
          status: toiletEditForm.status,
        },
        user.token
      );

      const updatedToilet: Toilet = {
        ...selectedToilet,
        name,
        roadAddress,
        openTime: toiletEditForm.openTime || undefined,
        managingOrg: toiletEditForm.managingOrg || undefined,
        phoneNumber: toiletEditForm.phoneNumber || undefined,
        hasDisabledFacility: toiletEditForm.disabledFacility,
        hasEmergencyBell: toiletEditForm.emergencyBell,
        hasDiaperTable: toiletEditForm.diaperTable,
        hasEntranceCctv: toiletEditForm.entranceCctv,
        status: toiletEditForm.status,
      };

      setAdminToilets((current) =>
        current.map((toilet) =>
          toilet.backendId === updatedToilet.backendId ? updatedToilet : toilet
        )
      );
      setPendingToilets((current) =>
        updatedToilet.status === "PENDING"
          ? current.map((toilet) =>
              toilet.backendId === updatedToilet.backendId ? updatedToilet : toilet
            )
          : current.filter((toilet) => toilet.backendId !== updatedToilet.backendId)
      );
      setSelectedToilet(updatedToilet);
      toast.success("화장실 정보가 수정되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "화장실 정보 수정에 실패했습니다.");
    } finally {
      setIsSavingToilet(false);
    }
  };

  const handleDeleteManagedToilet = async (toilet: Toilet) => {
    if (!user?.token || !toilet.backendId || deletingToiletId) return;

    if (!window.confirm(`"${toilet.name}" 화장실을 삭제할까요?`)) {
      return;
    }

    setDeletingToiletId(toilet.backendId);

    try {
      await deleteAdminToilet(toilet.backendId, user.token);
      setAdminToilets((current) => current.filter((item) => item.backendId !== toilet.backendId));
      setPendingToilets((current) => current.filter((item) => item.backendId !== toilet.backendId));
      toast.success("화장실이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "화장실 삭제에 실패했습니다.");
    } finally {
      setDeletingToiletId(null);
    }
  };

  const handleOpenRequestToiletEdit = (request: ToiletRequestNotification) => {
    const toiletId = Number(request.toiletId);
    const targetToilet = adminToilets.find((toilet) => toilet.backendId === toiletId);

    if (!targetToilet) {
      toast.error("화장실 목록을 새로고침한 뒤 다시 시도해주세요.");
      return;
    }

    handleOpenToiletEdit(targetToilet);
  };

  const handleCompleteUpdateRequest = async (request: ToiletRequestNotification) => {
    if (!user?.token || processingRequestId) return;

    setProcessingRequestId(request.id);

    try {
      await deleteToiletRequestNotification(request.id, user.token);
      setUpdateRequests((current) => current.filter((item) => item.id !== request.id));
      toast.success("수정 요청을 처리 완료했습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "수정 요청 처리에 실패했습니다.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDismissDeleteRequest = async (request: ToiletRequestNotification) => {
    if (!user?.token || processingRequestId) return;

    setProcessingRequestId(request.id);

    try {
      await deleteToiletRequestNotification(request.id, user.token);
      setDeleteRequests((current) => current.filter((item) => item.id !== request.id));
      toast.success("삭제 요청을 닫았습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "삭제 요청 처리에 실패했습니다.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleProcessDeleteRequest = async (request: ToiletRequestNotification) => {
    if (!user?.token || processingRequestId) return;

    const toiletId = Number(request.toiletId);

    if (!Number.isFinite(toiletId)) {
      toast.error("삭제할 화장실의 DB 식별자를 찾지 못했습니다.");
      return;
    }

    if (!window.confirm(`"${request.toiletName}" 화장실을 삭제하고 요청을 처리할까요?`)) {
      return;
    }

    setProcessingRequestId(request.id);

    try {
      await deleteAdminToilet(toiletId, user.token);
      setAdminToilets((current) => current.filter((item) => item.backendId !== toiletId));
      setPendingToilets((current) => current.filter((item) => item.backendId !== toiletId));
      setDeleteRequests((current) => current.filter((item) => item.id !== request.id));
      setUpdateRequests((current) => current.filter((item) => item.toiletId !== request.toiletId));
      toast.success("화장실 삭제 요청을 처리했습니다.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "삭제 요청 처리에 실패했습니다.");
    } finally {
      setProcessingRequestId(null);
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
              <p className="text-sm text-slate-300">화장실, 공지사항, 회원을 관리합니다</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatPanel icon={MapPin} label="전체 화장실" value={adminToilets.length} />
          <StatPanel icon={MapPin} label="승인 대기" value={pendingToilets.length} />
          <StatPanel icon={Pencil} label="수정 요청" value={updateRequests.length} />
          <StatPanel icon={Trash2} label="삭제 요청" value={deleteRequests.length} />
          <StatPanel icon={Megaphone} label="공지사항" value={notices.length} />
          <StatPanel icon={Users} label="회원" value={users.length} />
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          <AdminTabButton active={activeTab === "approvals"} onClick={() => setActiveTab("approvals")}>
            승인 관리
          </AdminTabButton>
          <AdminTabButton active={activeTab === "toiletManagement"} onClick={() => setActiveTab("toiletManagement")}>
            화장실 관리
          </AdminTabButton>
          <AdminTabButton active={activeTab === "updateRequests"} onClick={() => setActiveTab("updateRequests")}>
            수정 요청
          </AdminTabButton>
          <AdminTabButton active={activeTab === "deleteRequests"} onClick={() => setActiveTab("deleteRequests")}>
            삭제 요청
          </AdminTabButton>
          <AdminTabButton active={activeTab === "notices"} onClick={() => setActiveTab("notices")}>
            공지 관리
          </AdminTabButton>
          <AdminTabButton active={activeTab === "users"} onClick={() => setActiveTab("users")}>
            회원 관리
          </AdminTabButton>
        </div>

        {activeTab === "approvals" && (
          <section className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">승인 대기 화장실</h2>
                  <p className="mt-1 text-sm text-slate-300">사용자 등록 요청을 승인하거나 반려합니다.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadPendingToilets} disabled={isLoadingPendingToilets}>
                  <RefreshCw size={14} className="mr-2" />
                  새로고침
                </Button>
              </div>

              {pendingToiletError && (
                <ErrorPanel
                  message={pendingToiletError}
                  onRetry={loadPendingToilets}
                  loading={isLoadingPendingToilets}
                />
              )}
              {isLoadingPendingToilets ? (
                <LoadingPanel message="승인 대기 화장실을 불러오는 중입니다." />
              ) : pendingToilets.length === 0 ? (
                <EmptyPanel message="승인 대기 중인 화장실이 없습니다." />
              ) : (
                <div className="space-y-3">
                  {pendingToilets.map((toilet) => (
                    <div key={toilet.backendId ?? toilet.id} className="rounded-lg border bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">{toilet.name}</h3>
                            <Badge variant="secondary">대기</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{toilet.roadAddress || "주소 없음"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            관리번호 {toilet.managementNo} · 좌표 {toilet.lat ?? "-"}, {toilet.lng ?? "-"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => handleApproveToilet(toilet)}
                            disabled={!toilet.backendId || processingToiletId === toilet.backendId}
                            className="gap-2"
                          >
                            {processingToiletId === toilet.backendId ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejectToilet(toilet)}
                            disabled={!toilet.backendId || processingToiletId === toilet.backendId}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            {processingToiletId === toilet.backendId ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            반려
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "toiletManagement" && (
          <section className="space-y-4">
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-semibold text-white">전체 화장실 관리</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    공공데이터와 사용자 등록 화장실을 모두 검색해서 수정하거나 삭제합니다.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadAdminToilets} disabled={isLoadingAdminToilets}>
                  <RefreshCw size={14} className="mr-2" />
                  새로고침
                </Button>
              </div>

              <SearchBox
                value={toiletQuery}
                onChange={(value) => {
                  setToiletQuery(value);
                  setShowAllManagedToilets(false);
                }}
                placeholder="화장실 이름, 주소, 관리번호, 상태, 등록 유형 검색"
              />

              <div className="text-sm text-slate-300">
                검색 결과 {filteredAdminToilets.length}개
                {!showAllManagedToilets && filteredAdminToilets.length > visibleAdminToilets.length
                  ? ` 중 ${visibleAdminToilets.length}개 표시`
                  : ""}
              </div>

              {adminToiletError && (
                <ErrorPanel
                  message={adminToiletError}
                  onRetry={loadAdminToilets}
                  loading={isLoadingAdminToilets}
                />
              )}
              {isLoadingAdminToilets ? (
                <LoadingPanel message="전체 화장실 목록을 불러오는 중입니다." />
              ) : filteredAdminToilets.length === 0 ? (
                <EmptyPanel message={toiletQuery.trim() ? "검색 결과가 없습니다." : "등록된 화장실이 없습니다."} />
              ) : (
                <div className="space-y-3">
                  {visibleAdminToilets.map((toilet) => (
                    <div key={toilet.backendId ?? toilet.id} className="rounded-lg border bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">{toilet.name}</h3>
                            <Badge variant={getToiletStatusBadgeVariant(toilet.status) as "default" | "secondary" | "outline"}>
                              {getToiletStatusLabel(toilet.status)}
                            </Badge>
                            <Badge variant="outline">
                              {toilet.isUserSubmitted ? "사용자 등록" : "공공데이터"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{toilet.roadAddress || "주소 없음"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            DB ID {toilet.backendId ?? "-"} · 관리번호 {toilet.managementNo} · 좌표{" "}
                            {toilet.lat ?? "-"}, {toilet.lng ?? "-"}
                          </p>
                          {(toilet.openTime || toilet.managingOrg || toilet.phoneNumber) && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {toilet.openTime || "운영 시간 없음"}
                              {toilet.managingOrg && ` · ${toilet.managingOrg}`}
                              {toilet.phoneNumber && ` · ${toilet.phoneNumber}`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleOpenToiletEdit(toilet)}
                            disabled={!toilet.backendId}
                            className="gap-2"
                          >
                            <Pencil size={16} />
                            수정
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeleteManagedToilet(toilet)}
                            disabled={!toilet.backendId || deletingToiletId === toilet.backendId}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            {deletingToiletId === toilet.backendId ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredAdminToilets.length > visibleAdminToilets.length && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllManagedToilets(true)}
                    >
                      나머지 {filteredAdminToilets.length - visibleAdminToilets.length}개 더보기
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "updateRequests" && (
          <section className="space-y-4">
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-semibold text-white">화장실 수정 요청</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    관리자 소유 또는 공공데이터 화장실에 들어온 수정 요청을 확인합니다.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadToiletRequests} disabled={isLoadingToiletRequests}>
                  <RefreshCw size={14} className="mr-2" />
                  새로고침
                </Button>
              </div>

              {toiletRequestError && (
                <ErrorPanel
                  message={toiletRequestError}
                  onRetry={loadToiletRequests}
                  loading={isLoadingToiletRequests}
                />
              )}
              {isLoadingToiletRequests ? (
                <LoadingPanel message="수정 요청을 불러오는 중입니다." />
              ) : updateRequests.length === 0 ? (
                <EmptyPanel message="도착한 수정 요청이 없습니다." />
              ) : (
                <div className="space-y-3">
                  {updateRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">{request.toiletName}</h3>
                            <Badge variant="secondary">수정요청</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.roadAddress || "주소 없음"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            요청자 {request.requesterName} · 아이디 {request.requesterUserId}
                          </p>
                          <p className="mt-3 rounded-md bg-gray-50 p-3 text-sm leading-6 text-slate-700">
                            {request.message || "요청 내용이 없습니다."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleOpenRequestToiletEdit(request)}
                            className="gap-2"
                          >
                            <Pencil size={16} />
                            화장실 수정
                          </Button>
                          <Button
                            onClick={() => handleCompleteUpdateRequest(request)}
                            disabled={processingRequestId === request.id}
                            className="gap-2"
                          >
                            {processingRequestId === request.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            처리 완료
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "deleteRequests" && (
          <section className="space-y-4">
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-semibold text-white">화장실 삭제 요청</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    관리자 소유 또는 공공데이터 화장실에 들어온 삭제 요청을 처리합니다.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadToiletRequests} disabled={isLoadingToiletRequests}>
                  <RefreshCw size={14} className="mr-2" />
                  새로고침
                </Button>
              </div>

              {toiletRequestError && (
                <ErrorPanel
                  message={toiletRequestError}
                  onRetry={loadToiletRequests}
                  loading={isLoadingToiletRequests}
                />
              )}
              {isLoadingToiletRequests ? (
                <LoadingPanel message="삭제 요청을 불러오는 중입니다." />
              ) : deleteRequests.length === 0 ? (
                <EmptyPanel message="도착한 삭제 요청이 없습니다." />
              ) : (
                <div className="space-y-3">
                  {deleteRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">{request.toiletName}</h3>
                            <Badge variant="outline">삭제요청</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.roadAddress || "주소 없음"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            요청자 {request.requesterName} · 아이디 {request.requesterUserId}
                          </p>
                          <p className="mt-3 rounded-md bg-gray-50 p-3 text-sm leading-6 text-slate-700">
                            {request.message || "요청 내용이 없습니다."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleDismissDeleteRequest(request)}
                            disabled={processingRequestId === request.id}
                          >
                            요청 닫기
                          </Button>
                          <Button
                            onClick={() => handleProcessDeleteRequest(request)}
                            disabled={processingRequestId === request.id}
                            className="gap-2 bg-red-600 hover:bg-red-700"
                          >
                            {processingRequestId === request.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            삭제 처리
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "notices" && (
          <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">새 공지 등록</h2>
              <div className="space-y-3">
                <Input
                  value={noticeTitle}
                  onChange={(event) => setNoticeTitle(event.target.value)}
                  placeholder="공지 제목"
                  className="text-slate-950 placeholder:text-slate-400"
                />
                <Textarea
                  value={noticeContent}
                  onChange={(event) => setNoticeContent(event.target.value)}
                  placeholder="공지 내용"
                  className="text-slate-950 placeholder:text-slate-400"
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

      <Dialog open={!!selectedToilet} onOpenChange={(open) => !open && handleCloseToiletEdit()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{selectedToilet?.name ?? "화장실 정보 수정"}</DialogTitle>
            <DialogDescription>
              관리자 권한으로 화장실 기본 정보와 승인 상태를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedToilet && toiletEditForm && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-gray-50 p-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-gray-900">DB ID</p>
                    <p className="text-muted-foreground">{selectedToilet.backendId ?? "-"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">관리번호</p>
                    <p className="text-muted-foreground">{selectedToilet.managementNo}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">등록 유형</p>
                    <p className="text-muted-foreground">
                      {selectedToilet.isUserSubmitted ? "사용자 등록" : "공공데이터"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">좌표</p>
                    <p className="text-muted-foreground">
                      {selectedToilet.lat ?? "-"}, {selectedToilet.lng ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="admin-toilet-name">화장실 이름</Label>
                  <Input
                    id="admin-toilet-name"
                    value={toiletEditForm.name}
                    onChange={(event) =>
                      setToiletEditForm({ ...toiletEditForm, name: event.target.value })
                    }
                    placeholder="화장실 이름"
                    className="text-slate-950 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="admin-toilet-address">주소</Label>
                  <Input
                    id="admin-toilet-address"
                    value={toiletEditForm.roadAddress}
                    onChange={(event) =>
                      setToiletEditForm({ ...toiletEditForm, roadAddress: event.target.value })
                    }
                    placeholder="도로명 주소"
                    className="text-slate-950 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-toilet-open-time">운영 시간</Label>
                  <Input
                    id="admin-toilet-open-time"
                    value={toiletEditForm.openTime}
                    onChange={(event) =>
                      setToiletEditForm({ ...toiletEditForm, openTime: event.target.value })
                    }
                    placeholder="예: 24시간"
                    className="text-slate-950 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-toilet-org">관리기관</Label>
                  <Input
                    id="admin-toilet-org"
                    value={toiletEditForm.managingOrg}
                    onChange={(event) =>
                      setToiletEditForm({ ...toiletEditForm, managingOrg: event.target.value })
                    }
                    placeholder="관리기관"
                    className="text-slate-950 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-toilet-phone">관리기관 연락처</Label>
                  <Input
                    id="admin-toilet-phone"
                    value={toiletEditForm.phoneNumber}
                    onChange={(event) =>
                      setToiletEditForm({ ...toiletEditForm, phoneNumber: event.target.value })
                    }
                    placeholder="예: 02-1234-5678"
                    className="text-slate-950 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-toilet-status">승인 상태</Label>
                  <select
                    id="admin-toilet-status"
                    value={toiletEditForm.status}
                    onChange={(event) =>
                      setToiletEditForm({ ...toiletEditForm, status: event.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="APPROVED">승인</option>
                    <option value="PENDING">대기</option>
                    <option value="REJECTED">반려</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-medium text-slate-950">시설 특징</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-gray-50 px-4 py-3">
                    <Label htmlFor="admin-disabled-facility" className="cursor-pointer text-slate-950">
                      장애인 시설
                    </Label>
                    <Switch
                      id="admin-disabled-facility"
                      checked={toiletEditForm.disabledFacility}
                      onCheckedChange={(checked) =>
                        setToiletEditForm({ ...toiletEditForm, disabledFacility: checked })
                      }
                    />
                  </div>
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-gray-50 px-4 py-3">
                    <Label htmlFor="admin-emergency-bell" className="cursor-pointer text-slate-950">
                      비상벨
                    </Label>
                    <Switch
                      id="admin-emergency-bell"
                      checked={toiletEditForm.emergencyBell}
                      onCheckedChange={(checked) =>
                        setToiletEditForm({ ...toiletEditForm, emergencyBell: checked })
                      }
                    />
                  </div>
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-gray-50 px-4 py-3">
                    <Label htmlFor="admin-diaper-table" className="cursor-pointer text-slate-950">
                      기저귀 교환대
                    </Label>
                    <Switch
                      id="admin-diaper-table"
                      checked={toiletEditForm.diaperTable}
                      onCheckedChange={(checked) =>
                        setToiletEditForm({ ...toiletEditForm, diaperTable: checked })
                      }
                    />
                  </div>
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-gray-50 px-4 py-3">
                    <Label htmlFor="admin-entrance-cctv" className="cursor-pointer text-slate-950">
                      입구 CCTV
                    </Label>
                    <Switch
                      id="admin-entrance-cctv"
                      checked={toiletEditForm.entranceCctv}
                      onCheckedChange={(checked) =>
                        setToiletEditForm({ ...toiletEditForm, entranceCctv: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseToiletEdit} disabled={isSavingToilet}>
                  닫기
                </Button>
                <Button onClick={handleSaveManagedToilet} disabled={isSavingToilet}>
                  {isSavingToilet ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
          className="border-0 px-0 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
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
