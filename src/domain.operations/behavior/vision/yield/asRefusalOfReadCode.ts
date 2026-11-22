/**
 * .what = the refusal for each path or read error the caller can fix, by errno code; null when
 *         the code is none the caller can fix
 * .why  = the one errno policy of the depth lane: the realpath walk climbs on exactly the codes
 *         the read then refuses, so the two can never drift apart
 * .note = each hint is one move the caller can make; the path itself rides in the refusal's
 *         `vision` field, so a hint that names no write need not echo it
 */
export const asRefusalOfReadCode = (input: {
  code: string | null;
  pathRel: string;
}): { message: string; hint: string } | null => {
  if (input.code === 'ENOENT')
    return {
      message: 'the vision yield is absent',
      hint: `write ${input.pathRel}, then re-arrive`,
    };
  // ENOTDIR: a path that runs through a file (`<yield>/x`); no write could make it exist
  if (input.code === 'ENOTDIR')
    return {
      message: 'the vision path runs through a file',
      hint: "a part of the path is a file, not a dir; name the yield itself: --vision '<route>/1.vision.yield.md'",
    };
  if (input.code === 'EISDIR')
    return {
      message: 'the vision path is not a file',
      // the caller named a dir; name the yield that would sit in it, a path they can paste
      hint: `name the yield itself: --vision '${input.pathRel.replace(/\/+$/, '')}/1.vision.yield.md'`,
    };
  if (input.code === 'EACCES' || input.code === 'EPERM')
    return {
      message: 'the vision yield is unreadable',
      hint: `grant read access to ${input.pathRel}, then re-arrive`,
    };
  if (input.code === 'ELOOP')
    return {
      message: 'the vision path is a symlink loop',
      hint: "point the symlink at the real yield, or name the yield itself: --vision '<route>/1.vision.yield.md'",
    };
  if (input.code === 'ENAMETOOLONG')
    return {
      message: 'the vision path is too long for the os',
      hint: "name the yield itself: --vision '<route>/1.vision.yield.md'",
    };
  return null;
};
