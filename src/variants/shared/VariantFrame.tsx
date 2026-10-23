import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclaimer } from '../../components/Disclaimer';
import { useI18n } from '../../i18n/context';
import { isEmbedded, SCREENS, VARIANT_IDS, variantRouteId, type Screen, type VariantId } from '../registry';
import './variants.css';

interface Props {
  variant: VariantId;
  screen: Screen;
  children: ReactNode;
}

/**
 * Common wrapper of every variant screen: prototype banner with screen/variant switch, then the variant's own
 * content (scoped under .vx-root.vx-<id>), then the fictional-data label and the disclaimer.
 */
export function VariantFrame({ variant, screen, children }: Props) {
  const { t, path } = useI18n();
  const { search } = useLocation();
  const v = t.variants;
  const embed = isEmbedded(search) ? `?embed=1` : '';
  return (
    <div className={`vx-root vx-${variant}`} data-variant={variant} data-screen={screen}>
      <div className="vx-banner" role="note" aria-label={v.banner.aria}>
        <div className="vx-banner-inner">
          <p className="vx-banner-text">
            <span className="vx-banner-tag">{v.banner.tag}</span>
            <span className="vx-banner-name">
              {variant.toUpperCase()} · {v.variants[variant].name}
            </span>
            <span className="vx-banner-note">{v.banner.text}</span>
          </p>
          <div className="vx-banner-navs">
            <nav aria-label={v.screenNav}>
              <ul className="vx-seg">
                {SCREENS.map((s) => (
                  <li key={s}>
                    <Link to={`${path(variantRouteId(variant, s))}${embed}`} aria-current={s === screen ? 'page' : undefined}>
                      {v.screens[s]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={v.variantNav}>
              <ul className="vx-seg vx-seg-variants">
                {VARIANT_IDS.map((id) => (
                  <li key={id}>
                    <Link
                      to={`${path(variantRouteId(id, screen))}${embed}`}
                      aria-current={id === variant ? 'page' : undefined}
                      title={v.variants[id].name}
                    >
                      {id.toUpperCase()}
                      <span className="sr-only"> {v.variants[id].name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {!embed && (
              <Link className="vx-banner-back" to={path('matchVariants')}>
                {v.banner.gallery}
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className={`vx-body v${variant.slice(1)}-root`}>{children}</div>
      <div className="vx-foot">
        <p className="vx-fictional">{v.fictional}</p>
        <Disclaimer className="vx-disclaimer" />
      </div>
    </div>
  );
}
