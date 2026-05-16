/*
 * 파일 위치: src/app/pages/EditProfilePage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 사용자 정보 확인, 비밀번호 변경, 회원 탈퇴를 처리하는 프로필 수정 화면입니다.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, User, Lock, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { PasswordConfirmDialog } from "../components/PasswordConfirmDialog";
import { toast } from "sonner";
import { changePassword, loginWithAnyIdentifier } from "../api/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // 비밀번호 변경을 시도하는 경우에만 검증
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
      }

      if (!newPassword) {
        newErrors.newPassword = "새 비밀번호를 입력해주세요.";
      } else if (newPassword.length < 6) {
        newErrors.newPassword = "비밀번호는 6자 이상이어야 합니다.";
      }

      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (!newPassword) {
        toast.info("변경할 내용이 없습니다.");
        return;
      }

      let token = "";

      try {
        const response = await loginWithAnyIdentifier(
          [user.id, user.email],
          currentPassword
        );
        token = response.token;
      } catch (error) {
        console.error(error);
        setErrors((prev) => ({
          ...prev,
          currentPassword: "현재 비밀번호가 일치하지 않습니다.",
        }));
        toast.error("현재 비밀번호가 일치하지 않습니다.");
        return;
      }

      if (newPassword) {
        await changePassword(token, newPassword);
      }

      toast.success("회원정보가 수정되었습니다.");
      navigate("/mypage");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = (password: string) => {
    // TODO: 실제 구현 시 백엔드 API 호출하여 비밀번호 검증
    // const response = await fetch('/api/auth/verify-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ password })
    // });
    
    setShowPasswordConfirm(false);
    
    // TODO: 실제 구현 시 백엔드 API 호출
    // await fetch('/api/user/delete', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ password })
    // });

    deleteAccount();
    toast.success("회원탈퇴가 완료되었습니다.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/mypage")}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-semibold">회원정보 수정</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-6 space-y-6">
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <User size={16} />
              이메일 (변경 불가)
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-muted-foreground">
              아이디(이메일)는 변경할 수 없습니다.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User size={16} />
              이름 (변경 불가)
            </Label>
            <Input
              id="name"
              type="text"
              value={user.name}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-muted-foreground">
              이름은 변경할 수 없습니다.
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Lock size={16} />
              비밀번호 변경 (선택사항)
            </h3>

            {/* Current Password */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="현재 비밀번호"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrors({ ...errors, currentPassword: undefined });
                }}
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({ ...errors, newPassword: undefined });
                }}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({ ...errors, confirmPassword: undefined });
                }}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button className="w-full" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? "저장 중..." : "변경사항 저장"}
            </Button>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="mt-8 bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 mb-1">회원탈퇴</h3>
              <p className="text-sm text-red-700">
                회원탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
          >
            회원탈퇴
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              회원탈퇴 시 다음 정보가 모두 삭제됩니다:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>계정 정보</li>
                <li>등록한 화장실 정보</li>
                <li>작성한 리뷰</li>
                <li>즐겨찾기 목록</li>
              </ul>
              <p className="mt-3 font-medium text-red-600">
                이 작업은 취소할 수 없습니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setShowDeleteDialog(false);
                setShowPasswordConfirm(true);
              }}
            >
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Confirm Dialog for Deletion */}
      <PasswordConfirmDialog
        open={showPasswordConfirm}
        onOpenChange={setShowPasswordConfirm}
        onConfirm={handleDeleteAccount}
        title="비밀번호 확인"
        description="회원탈퇴를 진행하려면 비밀번호를 입력해주세요."
      />
    </div>
  );
}
