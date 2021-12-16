/*
#  Copyright 2020-2022 i3-MARKET Consortium:
#
#  ATHENS UNIVERSITY OF ECONOMICS AND BUSINESS - RESEARCH CENTER
#  ATOS SPAIN SA
#  EUROPEAN DIGITAL SME ALLIANCE
#  GFT ITALIA SRL
#  GUARDTIME OU
#  HOP UBIQUITOUS SL
#  IBM RESEARCH GMBH
#  IDEMIA FRANCE
#  SIEMENS AKTIENGESELLSCHAFT
#  SIEMENS SRL
#  TELESTO TECHNOLOGIES PLIROFORIKIS KAI EPIKOINONION EPE
#  UNIVERSITAT POLITECNICA DE CATALUNYA
#  UNPARALLEL INNOVATION LDA
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
*/

import {BindingScope, inject, injectable} from '@loopback/core';
import {ErrorWriterOptions} from 'strong-error-handler';
import {LogError, Reject, RejectProvider, RestBindings} from '@loopback/rest';

interface CustomError extends Error{
  name: string;
  message: string;
  stack?: string;
  response?: {
    body?: unknown
  };
  responseBody?: unknown;
}

@injectable({scope: BindingScope.SINGLETON})
export class CustomRejectProvider extends RejectProvider {
  constructor(
    @inject(RestBindings.SequenceActions.LOG_ERROR)
    protected logError: LogError,
    @inject(RestBindings.ERROR_WRITER_OPTIONS, {optional: true})
    protected errorWriterOptions?: ErrorWriterOptions,
  ) {super(logError, errorWriterOptions)}

  value(): Reject {
    return (context, error: Error) => {
      const customError: CustomError = error;
      if (customError.response != null){
        customError.responseBody = customError.response.body;
      }
      this.action(context, customError);
    }
  }

}