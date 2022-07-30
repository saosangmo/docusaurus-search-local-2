import fs from "fs";
import path from "path";
import { ProcessedPluginOptions } from "../../shared/interfaces";
import { getIndexHash } from "./getIndexHash";

export function generate(config: ProcessedPluginOptions, dir: string): string {
  const {
    language,
    removeDefaultStopWordFilter,
    removeDefaultStemmer,
    highlightSearchTermsOnTargetPage,
    searchResultLimits,
    searchResultContextMaxLength,
    explicitSearchResultPath,
    searchBarShortcut,
    searchBarShortcutHint,
    docsPluginIdForPreferredVersion,
    indexDocs,
  } = config;
  const indexHash = getIndexHash(config);
  const contents: string[] = [
    `import lunr from ${JSON.stringify(require.resolve("lunr"))};`,
  ];
  if (language.length > 1 || language.some((item) => item !== "en")) {
    contents.push(
      `require(${JSON.stringify(
        require.resolve("lunr-languages/lunr.stemmer.support")
      )})(lunr);`
    );
  }
  if (language.includes("ja") || language.includes("jp")) {
    contents.push(
      `require(${JSON.stringify(
        require.resolve("lunr-languages/tinyseg")
      )})(lunr);`
    );
  }
  for (const lang of language.filter(
    (item) => item !== "en" && item !== "zh"
  )) {
    contents.push(
      `require(${JSON.stringify(
        require.resolve(`lunr-languages/lunr.${lang}`)
      )})(lunr);`
    );
  }
  if (language.includes("zh")) {
    contents.push(
      'require("@easyops-cn/docusaurus-search-local/dist/client/shared/lunrLanguageZh").lunrLanguageZh(lunr);'
    );
  }
  if (language.length > 1) {
    contents.push(
      `require(${JSON.stringify(
        require.resolve("lunr-languages/lunr.multi")
      )})(lunr);`
    );
  }
  contents.push(`export const language = ${JSON.stringify(language)};`);
  contents.push(
    `export const removeDefaultStopWordFilter = ${JSON.stringify(
      removeDefaultStopWordFilter
    )};`
  );
  contents.push(
    `export const removeDefaultStemmer = ${JSON.stringify(
      removeDefaultStemmer
    )};`
  );
  if (highlightSearchTermsOnTargetPage) {
    contents.push(
      `export { default as Mark } from ${JSON.stringify(
        require.resolve("mark.js")
      )}`
    );
  } else {
    contents.push("export const Mark = null;");
  }

  let searchIndexFilename = "search-index.json";
  let searchIndexQuery = "";

  if (indexHash) {
    if (config.hashed === "filename") {
      searchIndexFilename = `search-index-${indexHash}.json`;
    } else {
      searchIndexQuery = `?_=${indexHash}`;
    }
  }
  const searchIndexUrl = searchIndexFilename + searchIndexQuery;
  contents.push(
    `export const searchIndexUrl = ${JSON.stringify(searchIndexUrl)};`
  );
  contents.push(
    `export const searchResultLimits = ${JSON.stringify(searchResultLimits)};`,
    `export const searchResultContextMaxLength = ${JSON.stringify(
      searchResultContextMaxLength
    )};`
  );
  contents.push(
    `export const explicitSearchResultPath = ${JSON.stringify(
      explicitSearchResultPath
    )};`
  );
  contents.push(
    `export const searchBarShortcut = ${JSON.stringify(searchBarShortcut)};`
  );
  contents.push(
    `export const searchBarShortcutHint = ${JSON.stringify(
      searchBarShortcutHint
    )};`
  );
  contents.push(
    `export const docsPluginIdForPreferredVersion = ${
      docsPluginIdForPreferredVersion === undefined
        ? "undefined"
        : JSON.stringify(docsPluginIdForPreferredVersion)
    };`
  );
  contents.push(`export const indexDocs = ${JSON.stringify(indexDocs)};`);

  fs.writeFileSync(path.join(dir, "generated.js"), contents.join("\n"));

  return searchIndexFilename;
}
