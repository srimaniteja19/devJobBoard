"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";

interface AddContactFormProps {
  applicationId: string;
}

export default function AddContactForm({ applicationId }: AddContactFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: role || undefined,
          email: email || undefined,
          linkedin: linkedin || undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        setRole("");
        setEmail("");
        setLinkedin("");
        setNotes("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-theme hover:text-accent-hover"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add contact
      </button>
    );
  }

  const inputCls = "mt-1 w-full border border-edge bg-surface px-2 py-1.5 text-[13px] text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-edge bg-bg p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Hiring Manager" className={inputCls} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">LinkedIn</label>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="press inline-flex items-center gap-1 bg-accent px-3 py-1.5 text-[12px] font-medium text-bg hover:bg-accent-hover disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="press px-3 py-1.5 text-[12px] font-light text-t-muted transition-theme hover:text-t-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
