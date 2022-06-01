import 'colors'
import Minimist from 'minimist'
export declare const omitProps: <
  P extends Object = any,
  K extends string = any,
>(
  obj: P,
  ...keys: K[]
) => Omit<P, K>
declare global {
  /**
   * Variável que armazena o caminho do pacote.
   */
  const $dirname: string
  /**
   * Variável que armazena o caminho central do pc.
   */
  const $home: string
  /**
   * Variável que guarda os argumentos passados para o script.
   * @type {Minimist.ParsedArgs}
   * @memberof global
   * @example $args._[0]
   */
  const $args: Minimist.ParsedArgs
  /**
   * Variável do caminho root do projeto usando o vp-env.
   */
  const $root: string
  /**
   * Remove propriedades do objeto.
   */
  const omit: typeof omitProps
}
