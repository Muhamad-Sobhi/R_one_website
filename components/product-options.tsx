'use client';

import { Check } from 'lucide-react';
import { type Product, productColors, productSizes, sizeStock } from '@/lib/store';

type ProductOptionsProps = {
  product: Product;
  size: string;
  color: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  sizeRequired?: boolean;
};

export default function ProductOptions({
  product,
  size,
  color,
  onSizeChange,
  onColorChange,
  sizeRequired = true,
}: ProductOptionsProps) {
  const sizes = productSizes(product);
  const colors = productColors(product);
  if (!sizes.length && !colors.length) return null;

  return (
    <div className="product-options">
      {colors.length ? (
        <div className="option-block">
          <div className="option-head">
            <span>اللون</span>
            {color ? <b>{color}</b> : null}
          </div>
          <div className="color-options" role="radiogroup" aria-label="اختار اللون">
            {colors.map((option) => {
              const active = option.name === color;
              const out = typeof option.stock === 'number' && option.stock <= 0;
              return (
                <button
                  key={option.name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`color-option ${active ? 'color-option-active' : ''} ${out ? 'color-option-out' : ''}`}
                  style={option.hex ? ({ '--swatch': option.hex } as React.CSSProperties) : undefined}
                  onClick={() => onColorChange(option.name)}
                  title={option.name}
                >
                  <i className="color-dot" style={option.hex ? { background: option.hex } : undefined}>
                    {option.hex ? null : <span>{option.name.slice(0, 2)}</span>}
                    {active ? <Check size={11} /> : null}
                  </i>
                  <span className="color-name">{option.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {sizes.length ? (
        <div className="option-block">
          <div className="option-head">
            <span>المقاس</span>
            <b className={size ? '' : 'option-required'}>{size || 'اختار المقاس'}</b>
          </div>
          <div className="size-options" role="radiogroup" aria-label="اختار المقاس">
            {sizes.map((option) => {
              const active = option.name === size;
              const out = typeof option.stock === 'number' && option.stock <= 0;
              return (
                <button
                  key={option.name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={out}
                  className={`size-option ${active ? 'size-option-active' : ''}`}
                  onClick={() => onSizeChange(option.name)}
                >
                  {option.name}
                  {out ? <small>خلص</small> : null}
                </button>
              );
            })}
          </div>
          {size && sizeRequired && typeof sizeStock(product, size) === 'number' ? (
            <small className="option-note">المتاح من المقاس ده: {sizeStock(product, size)} قطعة</small>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function productOptionSummary(product: Product, size?: string, color?: string) {
  const parts = [color, size].filter(Boolean) as string[];
  const valid = (value: string, list: string[]) => list.includes(value);
  return parts
    .filter((part) =>
      valid(part, productColors(product).map((entry) => entry.name)) || valid(part, productSizes(product).map((entry) => entry.name)),
    )
    .join(' · ');
}