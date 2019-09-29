import {extractAllListPatterns} from 'formatjs-extract-cldr-data';
import {resolve, join} from 'path';
import {outputFileSync} from 'fs-extra';
import * as serialize from 'serialize-javascript';
import {isEmpty} from 'lodash';

const data = extractAllListPatterns();

function extractLocales(locales?: string[] | string): Record<string, string> {
  return Object.keys(data).reduce(function(
    files: Record<string, string>,
    locale
  ) {
    if (!Array.isArray(locales) || locales.includes(locale)) {
      var lang = locale.split('-')[0];
      if (!isEmpty(data[locale])) {
        if (!files[lang]) {
          files[lang] = serialize({fields: data[locale], locale});
        } else {
          files[lang] += ',' + serialize({fields: data[locale], locale});
        }
      }
    }
    return files;
  },
  {});
}

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

// Dist all locale files to dist/locale-data
const allLocaleFiles = extractLocales();
Object.keys(allLocaleFiles).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + '.js');
  outputFileSync(
    destFile,
    `/* @generated */	
// prettier-ignore
if (Intl.ListFormat && typeof Intl.ListFormat.__addLocaleData === 'function') {
  Intl.ListFormat.__addLocaleData(${allLocaleFiles[lang]})
}`
  );
});

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.ts'),
  `/* @generated */	
// prettier-ignore  
import IntlListFormat from "./core";\n
IntlListFormat.__addLocaleData(${Object.keys(allLocaleFiles)
    .map(lang => allLocaleFiles[lang])
    .join(',\n')});	
export default IntlListFormat;	
  `
);