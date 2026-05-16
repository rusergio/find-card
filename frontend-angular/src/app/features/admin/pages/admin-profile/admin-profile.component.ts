import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

const AVATAR_MAX_BYTES = 450_000;
const PROFILE_EXTRAS_KEY = 'bm-admin-profile-extras';

type ProfileExtras = {
  timezone: string;
  auditAlerts: boolean;
  weeklyReport: boolean;
  digest: 'off' | 'weekly' | 'daily';
};

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-profile.component.html',
})
export class AdminProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly user = this.auth.user;
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly toast = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  protected readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^[\d\s+()-]{0,20}$/)]],
    workTitle: [''],
    timezone: ['Europe/Lisbon'],
    auditAlerts: [true],
    weeklyReport: [true],
    digest: this.fb.nonNullable.control<'off' | 'weekly' | 'daily'>('weekly'),
  });

  ngOnInit(): void {
    const u = this.auth.user();
    if (!u) {
      return;
    }
    let first = '';
    let last = '';
    const rawName = u.fullName?.trim() || u.displayName?.trim() || '';
    if (rawName) {
      const parts = rawName.split(/\s+/);
      first = parts[0] ?? '';
      last = parts.slice(1).join(' ');
    }
    this.profileForm.patchValue({
      firstName: first,
      lastName: last,
      phone: u.phone ?? '',
    });
    this.avatarPreview.set(u.avatarDataUrl ?? null);

    const parsed = readProfileExtras(isPlatformBrowser(this.platformId));
    if (parsed) {
      this.profileForm.patchValue(parsed);
    }
  }

  protected onPickAvatar(ev: Event): void {
    this.toast.set(null);
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) {
      this.toast.set({ type: 'err', text: 'Escolha uma imagem (JPG ou PNG).' });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      this.toast.set({ type: 'err', text: 'Imagem demasiado grande — use até ~400 KB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null;
      if (url && url.length > 600_000) {
        this.toast.set({ type: 'err', text: 'Ficheiro demasiado pesado após leitura.' });
        return;
      }
      this.avatarPreview.set(url);
    };
    reader.readAsDataURL(file);
  }

  protected clearAvatar(): void {
    this.avatarPreview.set(null);
    this.auth.updateLocalProfile({ avatarDataUrl: undefined });
    this.flashOk('Foto removida.');
  }

  protected saveProfile(): void {
    this.toast.set(null);
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toast.set({ type: 'err', text: 'Corrija os campos em destaque antes de guardar.' });
      return;
    }

    const v = this.profileForm.getRawValue();
    const fullName = `${v.firstName.trim()} ${v.lastName.trim()}`.trim();
    const fallback = this.auth.user()?.email.split('@')[0]?.trim() || 'Administrador';

    this.auth.updateLocalProfile({
      fullName,
      displayName: fullName || fallback,
      phone: v.phone.trim() || undefined,
      avatarDataUrl: this.avatarPreview() ?? undefined,
    });

    if (isPlatformBrowser(this.platformId)) {
      const extras: ProfileExtras = {
        timezone: v.timezone,
        auditAlerts: v.auditAlerts,
        weeklyReport: v.weeklyReport,
        digest: v.digest,
      };
      localStorage.setItem(PROFILE_EXTRAS_KEY, JSON.stringify(extras));
    }

    this.flashOk('Perfil atualizado. As alterações ficam neste dispositivo.');
  }

  private flashOk(text: string): void {
    this.toast.set({ type: 'ok', text });
    if (isPlatformBrowser(this.platformId)) {
      window.setTimeout(() => this.toast.set(null), 3200);
    }
  }
}

function readProfileExtras(browser: boolean): Partial<ProfileExtras> | null {
  if (!browser) {
    return null;
  }
  try {
    const raw = localStorage.getItem(PROFILE_EXTRAS_KEY);
    if (!raw) {
      return null;
    }
    const o = JSON.parse(raw) as Record<string, unknown>;
    const timezone = typeof o['timezone'] === 'string' ? o['timezone'] : undefined;
    const auditAlerts = typeof o['auditAlerts'] === 'boolean' ? o['auditAlerts'] : undefined;
    const weeklyReport = typeof o['weeklyReport'] === 'boolean' ? o['weeklyReport'] : undefined;
    const digestRaw = o['digest'];
    const digest =
      digestRaw === 'off' || digestRaw === 'weekly' || digestRaw === 'daily' ? digestRaw : undefined;
    const out: Partial<ProfileExtras> = {};
    if (timezone !== undefined) {
      out.timezone = timezone;
    }
    if (auditAlerts !== undefined) {
      out.auditAlerts = auditAlerts;
    }
    if (weeklyReport !== undefined) {
      out.weeklyReport = weeklyReport;
    }
    if (digest !== undefined) {
      out.digest = digest;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
