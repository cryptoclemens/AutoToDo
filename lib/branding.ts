export interface BrandingSource {
  brand_color?: string | null
  logo_url?: string | null
}

/**
 * Resolve effective branding: project overrides workspace when not inherited.
 */
export function getEffectiveBranding(
  project: (BrandingSource & { branding_inherited?: boolean }) | null,
  workspace: BrandingSource
): { brand_color: string; logo_url: string | null } {
  const defaultColor = '#2563EB'

  if (!project || project.branding_inherited !== false) {
    return {
      brand_color: workspace.brand_color || defaultColor,
      logo_url: workspace.logo_url ?? null,
    }
  }

  return {
    brand_color: project.brand_color || workspace.brand_color || defaultColor,
    logo_url: project.logo_url ?? workspace.logo_url ?? null,
  }
}
