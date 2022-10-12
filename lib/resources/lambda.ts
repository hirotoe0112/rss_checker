import { Construct } from 'constructs';
import { aws_lambda_nodejs as lambda, Duration } from 'aws-cdk-lib';

export class Lambda {
  private readonly _scope:Construct;
  private readonly _topicArn:string;

  constructor(scope:Construct, topicArn:string) {
    this._scope = scope;
    this._topicArn = topicArn;
  }

  public create():lambda.NodejsFunction{
    return new lambda.NodejsFunction(this._scope, 'lambda', {
      entry:'lambda/rss-check.ts',
      timeout: Duration.minutes(3),
      environment:{
        TOPIC_ARN:this._topicArn
      }
    })
  }
}
