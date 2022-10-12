import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';

export class EventRule {
  private readonly _scope:Construct;

  constructor(scope:Construct) {
    this._scope = scope;
  }

  public create():events.Rule{
    return new events.Rule(this._scope, 'event', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '23',
      })
    });
  }
}
