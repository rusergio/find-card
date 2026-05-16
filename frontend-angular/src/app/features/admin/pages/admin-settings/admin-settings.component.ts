import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

type LanguageOption = { value: string; label: string; flag: string };
type DensityOption = { value: 'comfortable' | 'compact'; label: string; hint: string; icon: string };

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-settings.component.html',
})
export class AdminSettingsComponent {
  private readonly fb = new FormBuilder();
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly savedMessage = signal<string | null>(null);
  protected readonly languageMenuOpen = signal(false);

  protected readonly languageOptions: LanguageOption[] = [
    { value: 'pt-PT', label: 'Português (PT)', flag: '🇵🇹' },
    { value: 'es-ES', label: 'Español (ES)', flag: '🇪🇸' },
    { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  ];

  protected readonly densityOptions: DensityOption[] = [
    { value: 'comfortable', label: 'Confortável', hint: 'Espaçamento amplo nas tabelas', icon: 'pi-stop' },
    { value: 'compact', label: 'Compacta', hint: 'Mais linhas por ecrã', icon: 'pi-bars' },
  ];

  protected readonly appForm = this.fb.nonNullable.group({
    language: ['pt-PT', [Validators.required]],
    density: ['comfortable' as 'comfortable' | 'compact', [Validators.required]],
    auditAlerts: [true],
    weeklyDigest: [false],
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }

  protected saveSection(sectionName: string): void {
    this.savedMessage.set(`${sectionName} guardado com sucesso.`);
    setTimeout(() => this.savedMessage.set(null), 2500);
  }

  protected selectedLanguage(): LanguageOption {
    return (
      this.languageOptions.find((opt) => opt.value === this.appForm.controls.language.value) ??
      this.languageOptions[0]
    );
  }

  protected toggleLanguageMenu(): void {
    this.languageMenuOpen.update((open) => !open);
  }

  protected pickLanguage(value: string): void {
    this.appForm.controls.language.setValue(value);
    this.languageMenuOpen.set(false);
  }

  protected pickDensity(value: 'comfortable' | 'compact'): void {
    this.appForm.controls.density.setValue(value);
  }

  @HostListener('document:click')
  protected closeMenusOnOutsideClick(): void {
    this.languageMenuOpen.set(false);
  }
}
