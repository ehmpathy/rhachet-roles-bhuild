// cli entry points for portable skill dispatch — each loads lazily; skills
// import the lighter `rhachet-roles-bhuild/cli` subpath, which skips the sdk
export { cli } from './contract/cli';
export * from './contract/sdk';
