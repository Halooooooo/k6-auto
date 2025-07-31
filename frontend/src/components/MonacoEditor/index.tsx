import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Spin } from 'antd';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string | number;
  theme?: string;
  readOnly?: boolean;
  options?: any;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  height = '400px',
  theme = 'vs-dark',
  readOnly = false,
  options = {},
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // 配置JavaScript/TypeScript的自动补全
    if (language === 'javascript' || language === 'typescript') {
      // 添加k6相关的类型定义和自动补全
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        `
        declare module 'k6/http' {
          export function get(url: string, params?: any): any;
          export function post(url: string, body?: any, params?: any): any;
          export function put(url: string, body?: any, params?: any): any;
          export function del(url: string, params?: any): any;
          export function patch(url: string, body?: any, params?: any): any;
          export function head(url: string, params?: any): any;
          export function options(url: string, params?: any): any;
          export function request(method: string, url: string, body?: any, params?: any): any;
        }
        
        declare module 'k6' {
          export function check(val: any, sets: any): boolean;
          export function sleep(t: number): void;
          export function group(name: string, fn: () => void): void;
          export const __VU: number;
          export const __ITER: number;
        }
        
        declare module 'k6/metrics' {
          export class Counter {
            constructor(name: string, isTime?: boolean);
            add(value: number, tags?: any): void;
          }
          export class Gauge {
            constructor(name: string, isTime?: boolean);
            add(value: number, tags?: any): void;
          }
          export class Rate {
            constructor(name: string, isTime?: boolean);
            add(value: boolean | number, tags?: any): void;
          }
          export class Trend {
            constructor(name: string, isTime?: boolean);
            add(value: number, tags?: any): void;
          }
        }
        `,
        'k6-types.d.ts'
      );
    }
  };

  const defaultOptions = {
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 20,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    readOnly,
    ...options,
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={theme}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={defaultOptions}
      loading={<Spin size="large" />}
    />
  );
};

export default MonacoEditor;