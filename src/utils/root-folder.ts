import pkgDir from "pkg-dir";

export default async (): Promise<string> => {
    return await pkgDir(__dirname);
};