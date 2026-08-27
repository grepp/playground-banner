/** 프로덕션 `$lg-down` — EventBanner / picture source 와 동일. */
export const LG_DOWN_MAX_WIDTH = 991;

export const BANNER_HEIGHT_DESKTOP = 400;
export const BANNER_HEIGHT_MOBILE = 430;

export function isLgDown(width: number): boolean {
  return width <= LG_DOWN_MAX_WIDTH;
}
