type FunctionWithArgs<Args extends any[], ReturnType> = Args extends []
  ? () => ReturnType
  : (...args: Args) => ReturnType;

export default FunctionWithArgs;
