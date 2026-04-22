import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// ─── Token colors (fixed — always dark terminal palette) ───────────────────
const C = {
  bg:        '#050505',
  gutter:    '#1a1a1a',
  lineNum:   '#3a3a3a',
  keyword:   '#00c97a',  // accent green
  type_:     '#e5c07b',  // warm yellow
  string_:   '#f5a623',  // orange
  number_:   '#79b8ff',  // sky blue
  comment:   '#4b5263',  // dim grey
  lifetime:  '#c678dd',  // purple
  macro_:    '#61afef',  // light blue
  attribute: '#e06c75',  // red-pink
  ident:     '#abb2bf',  // muted grey
  punct:     '#7a8694',  // darker grey
  default_:  '#e2e2e2',  // white
};

// ─── Keyword / type sets ───────────────────────────────────────────────────
const KW = new Set([
  'as','async','await','break','const','continue','crate','dyn','else',
  'enum','extern','false','fn','for','if','impl','in','let','loop',
  'match','mod','move','mut','pub','ref','return','self','Self','static',
  'struct','super','trait','true','type','unsafe','use','where','while',
]);

const TY = new Set([
  'bool','char','f32','f64','i8','i16','i32','i64','i128','isize',
  'str','u8','u16','u32','u64','u128','usize',
  'String','Vec','Option','Result','Box','Arc','Rc','Cell','RefCell',
  'Mutex','RwLock','HashMap','HashSet','BTreeMap','BTreeSet',
  'Some','None','Ok','Err','Path','PathBuf','Cow','Pin',
]);

// ─── Tokenizer ─────────────────────────────────────────────────────────────
function tokenizeLine(line, inBlockComment) {
  const tokens = [];
  let i = 0;

  // Entire line is inside a block comment
  if (inBlockComment) {
    const end = line.indexOf('*/');
    if (end === -1) {
      return { tokens: [{ t: 'comment', v: line }], stillInBlock: true };
    }
    tokens.push({ t: 'comment', v: line.slice(0, end + 2) });
    i = end + 2;
    // fall through to tokenize the rest of the line normally
  }

  while (i < line.length) {
    const ch = line[i];

    // Line comment
    if (ch === '/' && line[i + 1] === '/') {
      tokens.push({ t: 'comment', v: line.slice(i) });
      return { tokens, stillInBlock: false };
    }

    // Block comment
    if (ch === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end === -1) {
        tokens.push({ t: 'comment', v: line.slice(i) });
        return { tokens, stillInBlock: true };
      }
      tokens.push({ t: 'comment', v: line.slice(i, end + 2) });
      i = end + 2;
      continue;
    }

    // Attribute  #[...]  or  #![...]
    if (ch === '#' && (line[i + 1] === '[' || (line[i + 1] === '!' && line[i + 2] === '['))) {
      let j = i;
      let depth = 0;
      while (j < line.length) {
        if (line[j] === '[') depth++;
        else if (line[j] === ']') { if (--depth === 0) { j++; break; } }
        j++;
      }
      tokens.push({ t: 'attribute', v: line.slice(i, j) });
      i = j;
      continue;
    }

    // Double-quoted string
    if (ch === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === '"')  { j++;    break;    }
        j++;
      }
      tokens.push({ t: 'string_', v: line.slice(i, j) });
      i = j;
      continue;
    }

    // Lifetime  'a  or char literal  'x'
    if (ch === "'") {
      // Lifetime: 'ident (not followed by closing quote immediately)
      if (/[a-z_]/.test(line[i + 1])) {
        let j = i + 1;
        while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
        // If no closing quote right after — it's a lifetime
        if (line[j] !== "'") {
          tokens.push({ t: 'lifetime', v: line.slice(i, j) });
          i = j;
          continue;
        }
      }
      // Char literal
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === "'")  { j++;    break;    }
        j++;
      }
      tokens.push({ t: 'string_', v: line.slice(i, j) });
      i = j;
      continue;
    }

    // Number  (0x… 0b… 0o… floats integers)
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[0-9a-fA-FxXoObBuifUIF_.]/.test(line[j])) j++;
      tokens.push({ t: 'number_', v: line.slice(i, j) });
      i = j;
      continue;
    }

    // Identifier / keyword / type / macro
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);

      // Macro call: word!
      if (line[j] === '!') {
        tokens.push({ t: 'macro_', v: word + '!' });
        i = j + 1;
        continue;
      }

      if      (KW.has(word))           tokens.push({ t: 'keyword',  v: word });
      else if (TY.has(word))           tokens.push({ t: 'type_',    v: word });
      else if (/^[A-Z]/.test(word))    tokens.push({ t: 'type_',    v: word });
      else                             tokens.push({ t: 'ident',    v: word });
      i = j;
      continue;
    }

    // Everything else (punctuation, operators, whitespace)
    tokens.push({ t: 'punct', v: ch });
    i++;
  }

  return { tokens, stillInBlock: false };
}

function tokenizeSource(code) {
  const raw = code.split('\n');
  const result = [];
  let inBlock = false;

  for (const line of raw) {
    const { tokens, stillInBlock } = tokenizeLine(line, inBlock);
    result.push(tokens);
    inBlock = stillInBlock;
  }

  return result;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function RustCodeViewer({ code, filename = 'main.rs', onDownload, embedded = false }) {
  const { colors } = useTheme();

  const tokenizedLines = useMemo(() => tokenizeSource(code), [code]);
  const lineCount = tokenizedLines.length;
  const gutterWidth = String(lineCount).length * 9 + 16;

  const maxLen = useMemo(
    () => Math.max(...code.split('\n').map((l) => l.length), 40),
    [code]
  );
  const contentWidth = Math.max(maxLen * 7.2 + gutterWidth + 24, 360);

  const handleShare = () => {
    Share.share({ message: code, title: filename }).catch(() => {});
  };

  const codeArea = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      style={{ backgroundColor: C.bg, flex: embedded ? 1 : undefined }}
    >
      <View style={{ width: contentWidth }}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={embedded ? { flex: 1 } : { maxHeight: 420 }}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
            {tokenizedLines.map((lineTokens, lineIdx) => (
              <View
                key={lineIdx}
                style={{
                  flexDirection: 'row',
                  minHeight: 20,
                  alignItems: 'flex-start',
                }}
              >
                {/* Gutter */}
                <View
                  style={{
                    width: gutterWidth,
                    backgroundColor: C.gutter,
                    alignItems: 'flex-end',
                    paddingRight: 12,
                    paddingLeft: 8,
                    borderRightWidth: 1,
                    borderRightColor: '#1e1e1e',
                    marginRight: 16,
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      color: C.lineNum,
                      fontFamily: 'monospace',
                      fontSize: 11,
                      lineHeight: 20,
                    }}
                  >
                    {lineIdx + 1}
                  </Text>
                </View>

                {/* Tokens */}
                <Text style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 20 }}>
                  {lineTokens.map((tok, tokIdx) => (
                    <Text
                      key={tokIdx}
                      style={{ color: C[tok.t] ?? C.default_ }}
                    >
                      {tok.v}
                    </Text>
                  ))}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
  );

  if (embedded) return codeArea;

  return (
    <View
      style={{
        borderWidth: 1,
        borderTopColor: colors.bevelDark,
        borderLeftColor: colors.bevelDark,
        borderBottomColor: colors.bevelLight,
        borderRightColor: colors.bevelLight,
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <View
        style={{
          backgroundColor: colors.bg3,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 7,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#f5a623' }} />
          <Text style={{ color: colors.textDim, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 }}>
            {filename} — {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {onDownload ? (
            <TouchableOpacity
              onPress={onDownload}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, backgroundColor: colors.bg3 }}
            >
              <Feather name="download" size={10} color={colors.textMid} />
              <Text style={{ color: colors.textMid, fontFamily: 'monospace', fontSize: 9, letterSpacing: 0.5 }}>Download</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleShare}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderTopColor: colors.bevelLight, borderLeftColor: colors.bevelLight, borderBottomColor: colors.bevelDark, borderRightColor: colors.bevelDark, backgroundColor: colors.bg3 }}
          >
            <Feather name="share-2" size={10} color={colors.textMid} />
            <Text style={{ color: colors.textMid, fontFamily: 'monospace', fontSize: 9, letterSpacing: 0.5 }}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      {codeArea}
    </View>
  );
}
