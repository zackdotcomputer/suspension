/**
 * Tests whether a refresh of data is needed given a first and second call to
 * an accessor function. If the function takes no parameters, none will be passed
 * to this check. If it does, two arrays will be passed representing the old and
 * new collections of parameters.
 */
export type RefreshIsNeededCheck<Args extends any[] = []> = Args extends []
  ? () => boolean
  : (oldArgs: Args | null, newArgs: Args) => boolean;

interface AllSuspensionOptions<Args extends any[] = []> {
  /**
   * Whether this hook should always appear to be loading if called outside
   * of the context of a browser window.
   */
  alwaysLoadingInSSR: boolean;
  /**
   * A custom function to define when this data should be refreshed from target.
   */
  shouldRefreshData: RefreshIsNeededCheck<Args>;
}

export const DefaultSuspensionOptions: AllSuspensionOptions<any[]> = {
  /// By default, we return a never-ending load state while in SSR
  alwaysLoadingInSSR: true,
  /// By default, we only refresh calls that take args where the new args
  /// fail a `===` test against the old args.
  shouldRefreshData: (...arr: (null | undefined | any[])[]): boolean => {
    /// This way we gracefully handle the cases where one or both of the
    /// args being compared are undefined without breaking the type signature
    /// of the function
    const [l, r] = arr;

    console.debug("Checking ", l, r);

    // Default test does a shallow === check of all the args. If they are the
    // same by this check, then DO NOT refresh the underlying data.
    if (l === r) {
      return false;
    }
    if (l == null || r == null || l.length !== r.length) {
      return true;
    }

    for (let i = 0; i < l.length; i += 1) {
      if (l[i] !== r[i]) {
        return true;
      }
    }

    return false;
  }
};

export type SuspensionOptions<Args extends any[] = []> = Partial<AllSuspensionOptions<Args>>;
