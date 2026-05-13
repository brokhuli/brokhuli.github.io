import path from "node:path";

const CASE_STUDY_SECTION_NAME = "CaseStudySection";
const CASE_STUDY_SECTION_PATH =
  "src/components/projects/CaseStudySection.astro";
const CASE_STUDY_IMAGE_NAME = "CaseStudyImage";
const CASE_STUDY_IMAGE_PATH = "src/components/projects/CaseStudyImage.astro";

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

function componentImportValue(filePath, componentName, componentPath) {
  const fromDir = path.dirname(filePath);
  const toFile = path.resolve(componentPath);
  let relative = path.relative(fromDir, toFile).replaceAll("\\", "/");
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return `import ${componentName} from "${relative}";`;
}

function componentImportNode(filePath, componentName, componentPath) {
  const importValue = componentImportValue(
    filePath,
    componentName,
    componentPath,
  );
  const sourceValue = importValue.match(/"([^"]+)"/)?.[1];

  return {
    type: "mdxjsEsm",
    value: importValue,
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
                local: { type: "Identifier", name: componentName },
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

function hasComponentImport(nodes, componentName) {
  return nodes.some(
    (node) =>
      node.type === "mdxjsEsm" &&
      typeof node.value === "string" &&
      node.value.includes(`import ${componentName}`),
  );
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
    name: CASE_STUDY_SECTION_NAME,
    attributes,
    children,
  };
}

function isStandaloneGifParagraph(node) {
  if (!node || node.type !== "paragraph") return false;
  if (!Array.isArray(node.children) || node.children.length !== 1) return false;
  const image = node.children[0];
  return (
    image.type === "image" &&
    typeof image.url === "string" &&
    image.url.toLowerCase().endsWith(".gif")
  );
}

function caseStudyImageNode(image) {
  return {
    type: "mdxJsxFlowElement",
    name: CASE_STUDY_IMAGE_NAME,
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "src",
        value: image.url,
      },
      {
        type: "mdxJsxAttribute",
        name: "alt",
        value: image.alt ?? "",
      },
    ],
    children: [],
  };
}

function usesJsxComponent(node, componentName) {
  if (!node || typeof node !== "object") return false;
  if (
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === componentName
  ) {
    return true;
  }
  if (!Array.isArray(node.children)) return false;
  return node.children.some((child) => usesJsxComponent(child, componentName));
}

export default function remarkProjectCaseStudySections() {
  return (tree, file) => {
    const filePath = file.path || file.history?.[0] || "";
    if (!isProjectMdx(filePath) || !Array.isArray(tree.children)) return;

    const output = [];
    let pendingHeading = null;
    let pendingChildren = [];
    let sectionCount = 0;
    let hasCaseStudyImage = false;

    const prepareSectionChildren = (children) =>
      children.map((node) => {
        if (usesJsxComponent(node, CASE_STUDY_IMAGE_NAME)) {
          hasCaseStudyImage = true;
        }
        if (!isStandaloneGifParagraph(node)) return node;
        hasCaseStudyImage = true;
        return caseStudyImageNode(node.children[0]);
      });

    const flushSection = () => {
      if (!pendingHeading) {
        output.push(...pendingChildren);
        pendingChildren = [];
        return;
      }

      output.push(
        caseStudySectionNode(
          textContent(pendingHeading).trim(),
          prepareSectionChildren(pendingChildren),
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
      const imports = [];
      if (!hasComponentImport(output, CASE_STUDY_SECTION_NAME)) {
        imports.push(
          componentImportNode(
            filePath,
            CASE_STUDY_SECTION_NAME,
            CASE_STUDY_SECTION_PATH,
          ),
        );
      }
      if (
        hasCaseStudyImage &&
        !hasComponentImport(output, CASE_STUDY_IMAGE_NAME)
      ) {
        imports.push(
          componentImportNode(
            filePath,
            CASE_STUDY_IMAGE_NAME,
            CASE_STUDY_IMAGE_PATH,
          ),
        );
      }
      output.splice(insertAt, 0, ...imports);
    }

    tree.children = output;
  };
}
