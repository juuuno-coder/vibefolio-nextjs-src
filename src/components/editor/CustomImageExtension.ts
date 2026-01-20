import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const CustomImageExtension = Image.extend({
  name: 'customImage',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      layout: {
        default: 'normal', // 'normal', 'full-width', 'padded'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      container.className = 'custom-image-container';
      container.contentEditable = 'false';

      const wrapper = document.createElement('div');
      wrapper.className = `custom-image-wrapper layout-${node.attrs.layout || 'normal'}`;

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      if (node.attrs.width) img.width = node.attrs.width;
      if (node.attrs.height) img.height = node.attrs.height;
      img.className = 'custom-image';

      // Layout options toolbar (top-right)
      const layoutToolbar = document.createElement('div');
      layoutToolbar.className = 'image-layout-toolbar';
      layoutToolbar.innerHTML = `
        <button class="layout-btn" data-layout="full-width" title="전체 폭으로 설정">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="4" width="14" height="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M1 6 L15 6" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
        <button class="layout-btn" data-layout="padded" title="여유 공간 추가">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="3" width="10" height="10" stroke="currentColor" stroke-width="1.5"/>
            <rect x="5" y="5" width="6" height="6" fill="currentColor" opacity="0.3"/>
          </svg>
        </button>
        <button class="layout-btn" data-layout="normal" title="기본 크기">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="4" width="8" height="8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      `;

      layoutToolbar.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;

        const layout = button.getAttribute('data-layout');
        const pos = getPos();

        if (layout && typeof pos === 'number') {
          editor.commands.updateAttributes('customImage', { layout });
          wrapper.className = `custom-image-wrapper layout-${layout}`;
        }
      });

      // Edit overlay (center)
      const overlay = document.createElement('div');
      overlay.className = 'image-edit-overlay';

      const editButton = document.createElement('button');
      editButton.className = 'image-edit-button';
      editButton.innerHTML = '✏️';
      editButton.contentEditable = 'false';

      const menu = document.createElement('div');
      menu.className = 'image-edit-menu';
      menu.style.display = 'none';
      menu.innerHTML = `
        <button class="menu-item" data-action="change-source">
          <span>🔗</span> 프레임 소스 변경
        </button>
        <button class="menu-item" data-action="add-text">
          <span>📝</span> 텍스트 추가
        </button>
        <button class="menu-item" data-action="replace-image">
          <span>🖼️</span> image 바꾸기
        </button>
        <button class="menu-item" data-action="delete-image">
          <span>🗑️</span> image 삭제
        </button>
      `;

      editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });

      menu.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const pos = getPos();

        switch (action) {
          case 'change-source':
            const newSrc = prompt('새 이미지 URL을 입력하세요:', node.attrs.src);
            if (newSrc && typeof pos === 'number') {
              editor.commands.updateAttributes('customImage', { src: newSrc });
            }
            break;
          case 'add-text':
            // 이미지 아래에 텍스트 블록 추가
            if (typeof pos === 'number') {
              editor.chain().focus().insertContentAt(pos + 1, '<p></p>').run();
            }
            break;
          case 'replace-image':
            // 파일 선택 트리거
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                // 여기서 이미지 업로드 처리 (부모 컴포넌트에서 처리하도록 이벤트 발생)
                const event = new CustomEvent('replaceImage', { detail: { file, pos } });
                container.dispatchEvent(event);
              }
            };
            input.click();
            break;
          case 'delete-image':
            if (typeof pos === 'number' && confirm('이미지를 삭제하시겠습니까?')) {
              editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
            }
            break;
        }

        menu.style.display = 'none';
      });

      overlay.appendChild(editButton);
      overlay.appendChild(menu);
      wrapper.appendChild(layoutToolbar);
      wrapper.appendChild(img);
      wrapper.appendChild(overlay);
      container.appendChild(wrapper);

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'customImage') return false;
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';
          wrapper.className = `custom-image-wrapper layout-${updatedNode.attrs.layout || 'normal'}`;
          return true;
        },
      };
    };
  },
});
