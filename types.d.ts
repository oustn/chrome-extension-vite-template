declare module 'crx' {
  interface CrxOptions {
    privateKey?: string
  }

  class CRX {
    constructor(options: CrxOptions)

    load(dist: string): Promise<this>

    pack(): Promise<Buffer>
  }
  export = CRX
}
