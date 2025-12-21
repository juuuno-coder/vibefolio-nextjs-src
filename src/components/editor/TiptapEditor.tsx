"use client";

import dynamic from 'next/dynamic';

const DynamicTiptap = dynamic(() => import('./TiptapEditor.client'), { ssr: false });

export default function TiptapEditor(props: any) {
  return <DynamicTiptap {...props} />;
}
