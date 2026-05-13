import path from "node:path";

const COMPONENT_NAME = "CaseStudySection";
const COMPONENT_PATH = "src/components/projects/CaseStudySection.astro";

function isProjectMdx(filePath) {
  if (!filePath || !filePath.endsWith(".mdx")) return false;
  const normalized = filePath.replaceAll("\\", "/");
  return normalized.includes("/src/content/projects/");
}

function textContent(node) {
  if (!node) return "";
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(textContent).join("");
}

function componentImportValue(filePath) {
  const fromDir = path.dirname(filePath);
  const toFile = path.resolve(COMPONENT_PATH);
  let relative = path.relative(fromDir, toFile).replaceAll("\\", "/");
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return `import ${COMPONENT_NAME} from "${relative}";`;
}

function componentImportNode(filePath) {
  const sourceValue = componentImportValue(filePath).match(/"([^"]+)"/)?.[1];

  return {
    type: "mdxjsEsm",
    value: componentImportValue(filePath),
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ImportDeclaration",
            specifiers: [
              {
                type: "ImportDefaultSpecifier",
                local: { type: "Identifier", name: COMPONENT_NAME },
              },
            ],
            source: {
              type: "Literal",
              value: sourceValue,
              raw: `"${sourceValue}"`,
            },
          },
        ],
      },
    },
  };
}

function caseStudySectionNode(title, children, isFirstSection) {
  const attributes = [
    {
      type: "mdxJsxAttribute",
      name: "title",
      value: title,
    },
  ];

  if (isFirstSection) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "variant",
      value: "accent",
    });
  }

  return {
    type: "mdxJsxFlowElement",
    name: COMPONENT_NAME,
    attributes,
    children,
  };
}

export default function remarkProjectCaseStudySections() {
  return (tree, file) => {
    const filePath = file.path || file.history?.[0] || "";
    if (!isProjectMdx(filePath) || !Array.isArray(tree.children)) return;

    const output = [];
    let pendingHeading = null;
    let pendingChildren = [];
    let sectionCount = 0;

    const flushSection = () => {
      if (!pendingHeading) {
        output.push(...pendingChildren);
        pendingChildren = [];
        return;
      }

      output.push(
        caseStudySectionNode(
          textContent(pendingHeading).trim(),
          pendingChildren,
          sectionCount === 0,
        ),
      );
      sectionCount += 1;
      pendingHeading = null;
      pendingChildren = [];
    };

    for (const node of tree.children) {
      if (node.type === "heading" && node.depth === 2) {
        flushSection();
        pendingHeading = node;
      } else if (pendingHeading) {
        pendingChildren.push(node);
      } else {
        output.push(node);
      }
    }

    flushSection();

    if (sectionCount > 0) {
      const firstNonImport = output.findIndex(
        (node) => node.type !== "mdxjsEsm",
      );
      const insertAt = firstNonImport === -1 ? output.length : firstNonImport;
      output.splice(insertAt, 0, componentImportNode(filePath));
    }

    tree.children = output;
  };
}
