
export namespace LibrariesN {

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   * RestRequestN
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  export namespace RestRequestN {

    /**
     *
     *
     *
     * methods
     *
     *
     *
     */
    export type methods = 'GET' | 'POST' | 'PUT' | 'DELETE';

    /**
     *
     *
     *
     * params send
     *
     *
     *
     */
    export type paramsSend = {
      url: string;
      data: string;
      method: methods;
      headers: any;
    }

    /**
     *
     *
     *
     * response send
     *
     *
     *
     */
    export type responseSend = {
      data: any;
      status: number;
      headers: any;
    }

    /**
     *
     *
     *
     * RestRequest
     *
     *
     *
     */
    export type RestRequest = {
      send(params: paramsSend, errors?: number): Promise<responseSend>;
    }

  }


  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   * WaitN
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  export namespace WaitN {

    /**
     *
     *
     *
     * wait
     *
     *
     *
     */
    export type Wait = (milliseconds: number) => Promise<void>;

  }

}
