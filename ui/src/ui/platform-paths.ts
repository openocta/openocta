/** Windows 路径展示文案（String.raw 保留反斜杠，避免 \\ 与 \\o 转义问题）。 */
export const WIN_OPENOCTA_APPDATA = String.raw`%APPDATA%\openocta`;
export const WIN_OPENOCTA_WORKSPACE = String.raw`%APPDATA%\openocta\workspace`;

export const UNIX_OPENOCTA_WORKSPACE = "~/.openocta/workspace";
