import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';

export class SnsTopic {
  private readonly _scope:Construct;

  constructor(scope:Construct) {
    this._scope = scope;
  }

  public create():sns.Topic{
    return new sns.Topic(this._scope, 'topic', { });
  }
}
