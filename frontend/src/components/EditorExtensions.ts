import { Mark, mergeAttributes } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList } from './MentionList';

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string) => ReturnType;
      unsetComment: (commentId: string) => ReturnType;
    }
  }
}

export const CommentMark = Mark.create<CommentOptions>({
  name: 'comment',
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-comment-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes['data-comment-id']) {
            return {};
          }
          return {
            'data-comment-id': attributes['data-comment-id'],
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span', 
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 
        class: 'comment-highlight', 
        'data-tippy-content': HTMLAttributes['data-comment-id']
      }), 
      0
    ];
  },

  addCommands() {
    return {
      setComment:
        (commentId) =>
        ({ commands }) => {
          return commands.setMark(this.name, { 'data-comment-id': commentId });
        },
      unsetComment:
        (_commentId) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.removeMark(tr.selection.from, tr.selection.to, this.type);
          }
          return true;
        },
    };
  },
});

export const getSuggestion = (getUsers: () => string[]) => ({
  items: ({ query }: { query: string }) => {
    return getUsers().filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer<any>;
    let popup: any[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        if (popup) popup[0].destroy();
        if (component) component.destroy();
      },
    };
  },
});
