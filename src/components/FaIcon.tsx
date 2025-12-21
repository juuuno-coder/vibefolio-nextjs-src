import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

const DynamicFa = dynamic(
  () => import('@fortawesome/react-fontawesome').then((mod) => mod.FontAwesomeIcon as unknown as ComponentType<any>),
  { ssr: false, loading: () => null }
);

export const FontAwesomeIcon: ComponentType<{ icon: IconProp } & any> = DynamicFa;
export default FontAwesomeIcon;
