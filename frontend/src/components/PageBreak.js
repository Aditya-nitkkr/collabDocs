import { Node, mergeAttributes } from "@tiptap/core";

export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        class: "page-break-divider",
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name });
        },
    };
  },
});
