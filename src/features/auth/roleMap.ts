export function mapClerkRoleToApp(role: string | null | undefined): string {
  switch (role) {
    case "owner":
      return "org:owner";
    case "admin":
      return "org:admin";
    case "coach":
      return "org:coach";
    case "athlete":
      return "org:athlete";
    case "viewer":
    case "basic_member":
      return "org:viewer";
    default:
      return "org:viewer";
  }
}
