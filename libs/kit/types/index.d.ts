declare namespace Vulppi {
  export interface KitConfig {
    /**
     * The port where the application will be running
     * @default 4000
     */
    port?: number
    /**
     * If you want change the default folder for the application
     */
    folders?: {
      /**
       * The folder where the application will be store temporary files
       * when the request is uploading files
       */
      uploadTemp?: string
    }
    /**
     * The limits for the application
     */
    limits?: {
      /**
       * Controls the maximum request body size of JSON.
       * If this is a number, then the value specifies the number of bytes.
       * If it is a string, the value is passed to the bytes library for parsing.
       *
       * @default '100kb'
       */
      jsonMaxSize?: number | string
      /**
       * Controls the maximum request body size.
       * If this is a number, then the value specifies the number of bytes.
       * If it is a string, the value is passed to the bytes library for parsing.
       *
       * @default '100kb'
       */
      bodyMaxSize?: number | string
      /**
       * Control origin for CORS
       * When `null` | `undefined` | `false` CORS is disabled
       *
       * @default undefined
       */
      cors?: undefined | null | false | string | string[]
    }
    messages?: {
      /**
       * The message for the status code 500
       *
       * @default 'Internal server error'
       */
      INTERNAL_SERVER_ERROR?: string
      /**
       * The message for the status code 404
       *
       * @default 'Not found'
       */
      NOT_FOUND?: string
      /**
       * The message for the status code 405
       *
       * @default 'Method not allowed'
       */
      METHOD_NOT_ALLOWED?: string
      /**
       * The message for the status code 400
       *
       * @default 'Multiple routes found'
       */
      MULTIPLE_ROUTES?: string
    }
    /**
     * The environment variables for the application
     * @default process.env
     * @example
     * ```ts
     * {
     *  DOMAIN: 'https://example.com',
     * }
     * ```
     */
    env?: Record<string, string>
  }

  export interface RequestHandler {}

  export interface ResponseMessage {
    data?: string | Record<string, any> | Blob | ArrayBuffer | Uint8Array
    status?: number
    headers?: Record<string, string>
  }
}

declare namespace Express {
  type Primitive = string | number | boolean

  interface ParsedQueryString {
    [x: string]:
      | undefined
      | Primitive
      | Primitive[]
      | ParsedQueryString
      | ParsedQueryString[]
  }

  interface Request {
    parsedQuery: ParsedQueryString
    custom?: CustomReqData
  }
}

declare interface CustomReqData {}

//  /**
//  * Controls the limits for files uploaded.
//  */
//  upload?: {
//   /**
//    * Maximum size of each form field name in bytes.
//    * If this is a number, then the value specifies the number of bytes.
//    * If it is a string, the value is passed to the bytes library for parsing.
//    *
//    * @default 100
//    */
//   fieldNameSize?: number | string
//   /**
//    * Maximum size of each form field value in bytes.
//    * If this is a number, then the value specifies the number of bytes.
//    * If it is a string, the value is passed to the bytes library for parsing.
//    *
//    * @default 1048576
//    */
//   fieldSize?: number | string
//   /**
//    * Maximum number of non-file form fields.
//    *
//    * @default Infinity
//    */
//   fields?: number
//   /**
//    * Maximum size of each file in bytes.
//    * If this is a number, then the value specifies the number of bytes.
//    * If it is a string, the value is passed to the bytes library for parsing.
//    *
//    * @default Infinity
//    */
//   fileSize?: number | string
//   /**
//    * Maximum number of file fields.
//    *
//    * @default Infinity
//    */
//   files?: number
//   /**
//    * Maximum number of parts (non-file fields + files).
//    *
//    * @default Infinity
//    */
//   parts?: number | string
//   /**
//    * Maximum number of headers.
//    *
//    * @default 2000
//    */
//   headerPairs?: number
// }
