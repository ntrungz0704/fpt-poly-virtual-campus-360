"use client";

import React, { useEffect, useState } from "react";
import type { StudentProfileDto, UpdateStudentProfileRequest } from "@fpt-campus/shared";
import { Badge, Button, ErrorState, Input, LoadingState } from "@/components/ui";
import { getUserInitials, getUserTypeLabel } from "@/lib/auth/auth-routing";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [major, setMajor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await portalApi.getProfile();
        if (!active) return;
        setProfile(data);
        setPhone(data.phone || "");
        setMajor(data.major || "");
        setAvatarUrl(data.avatarUrl || "");
        setBio(data.bio || "");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải hồ sơ người dùng.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload: UpdateStudentProfileRequest = {
        phone: phone.trim() || null,
        major: major.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      };
      const updated = await portalApi.updateProfile(payload);
      setProfile(updated);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Đang tải thông tin hồ sơ tài khoản..." className="max-w-2xl mx-auto py-12" />;
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Lỗi tải hồ sơ"
        description={error || "Không thể tải dữ liệu."}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
        className="max-w-xl mx-auto py-12"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="student-profile-page">
      {/* Header Profile Card */}
      <section className="ui-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
                {getUserInitials(profile.fullName)}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{getUserTypeLabel(profile.userType)}</Badge>
                <Badge variant={profile.accountStatus === "ACTIVE" ? "success" : "neutral"}>
                  {profile.accountStatus === "ACTIVE" ? "Đang hoạt động" : profile.accountStatus}
                </Badge>
              </div>
              <h1 className="type-h2 text-on-surface" data-testid="profile-fullname">
                {profile.fullName}
              </h1>
              <p className="text-xs text-secondary font-mono">
                Mã định danh: {profile.studentCode || profile.username || profile.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!editing ? (
              <Button
                variant="primary"
                size="sm"
                icon="edit"
                onClick={() => setEditing(true)}
                data-testid="edit-profile-btn"
              >
                Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Hủy bỏ
              </Button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div
            role="status"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-950 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600" aria-hidden="true">
              check_circle
            </span>
            <span>Hồ sơ đã được lưu thành công vào cơ sở dữ liệu!</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-surface-container-low text-xs">
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Điểm tích lũy XP</p>
            <p className="font-bold text-base text-primary">{profile.totalXp} XP</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Vé Open Day</p>
            <p className="font-bold text-base text-on-surface">{profile.ticketCount} vé</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Phụ huynh liên kết</p>
            <p className="font-bold text-base text-on-surface">{profile.approvedParentCount} người</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Chuyên ngành</p>
            <p className="font-bold text-on-surface truncate">{profile.major || "Chưa cập nhật"}</p>
          </div>
        </div>
      </section>

      {/* Details & Edit Form */}
      <section className="ui-card p-6 sm:p-8 space-y-5">
        <h2 className="type-h3 text-on-surface">Thông tin chi tiết</h2>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="rounded-xl border border-surface-container p-4 space-y-1">
              <span className="text-secondary font-medium">Email chính thức</span>
              <p className="font-semibold text-on-surface">{profile.email || "Chưa thiết lập"}</p>
            </div>
            <div className="rounded-xl border border-surface-container p-4 space-y-1">
              <span className="text-secondary font-medium">Số điện thoại liên hệ</span>
              <p className="font-semibold text-on-surface">{profile.phone || "Chưa thiết lập"}</p>
            </div>
            <div className="rounded-xl border border-surface-container p-4 space-y-1">
              <span className="text-secondary font-medium">Ngành học / Hướng nghiệp</span>
              <p className="font-semibold text-on-surface">{profile.major || "Chưa cập nhật"}</p>
            </div>
            <div className="rounded-xl border border-surface-container p-4 space-y-1">
              <span className="text-secondary font-medium">Tên đăng nhập hệ thống</span>
              <p className="font-mono font-semibold text-on-surface">{profile.username || "Chưa gán username"}</p>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-surface-container p-4 space-y-1">
              <span className="text-secondary font-medium">Giới thiệu ngắn (Bio)</span>
              <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
                {profile.bio || "Chưa có lời giới thiệu nào."}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Số điện thoại liên hệ"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912345678"
              />
              <Input
                label="Chuyên ngành / Quan tâm"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Ví dụ: Công nghệ thông tin / Thiết kế đồ họa"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Đường dẫn Avatar (URL ảnh)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-on-surface">Giới thiệu ngắn (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Đôi nét về sở thích, nguyện vọng ngành học..."
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-on-surface placeholder:text-secondary focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving} data-testid="save-profile-btn">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
