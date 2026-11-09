/**
 * .what = the refusal for each path or read error the caller can fix, by errno code; null when
 *         the code is none the caller can fix
 * .why  = the one errno policy of the depth lane: the realpath walk climbs on exactly the codes
 *         the read then refuses, so the two can never drift apart
 */
export const asRefusalOfReadCode = (input: {
  code: string | null;
  pathRel: string;
}): { message: string; hint: string } | null => {
  // ENOTDIR: a path that runs through a file (`<yield>/x`) names no file, so it is absent too
  if (input.code === 'ENOENT' || input.code === 'ENOTDIR')
    return {
      message: 'the vision yield is absent',
      hint: `write ${input.pathRel}, then re-arrive`,
    };
  if (input.code === 'EISDIR')
    return {
      message: 'the vision path is not a file',
      hint: "name the yield itself: --vision '$route/1.vision.yield.md'",
    };
  if (input.code === 'EACCES' || input.code === 'EPERM')
    return {
      message: 'the vision yield is unreadable',
      hint: `grant read access to ${input.pathRel}, then re-arrive`,
    };
  // ELOOP: a symlink loop · ENAMETOOLONG: a path past the os limit; each names no file to read
  if (input.code === 'ELOOP' || input.code === 'ENAMETOOLONG')
    return {
      message: 'the vision path names no file it can read',
      hint: `point --vision at the yield itself, not a symlink loop or an overlong path: ${input.pathRel}`,
    };
  return null;
};
