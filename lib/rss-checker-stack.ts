import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { EventRule } from './resources/event-rule'
import { Lambda } from './resources/lambda'
import { SnsTopic } from './resources/sns-topic'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as dotenv from 'dotenv'

export class RssCheckerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Create Event Rule Resource
     */
    const eventRule = new EventRule(this);
    const rule = eventRule.create();

    /**
     * Create SNS Topic Resource
     */
    const snsTopie = new SnsTopic(this);
    const topic = snsTopie.create();

    /**
     * Create Lambda Resources
     */
    const lambda = new Lambda(this, topic.topicArn);
    const fn = lambda.create();

    /**
     * Set up integrations
     */
    // EventBridge -> Lambda
    const eventTarget = new targets.LambdaFunction(fn);
    rule.addTarget(eventTarget);

    // SNS Topic -> Subscription
    dotenv.config()
    let mailaddress = ""
    if(typeof(process.env.SNS_MAIL) === 'string'){
      mailaddress = process.env.SNS_MAIL
    }
    const sub = new subscriptions.EmailSubscription(mailaddress);
    topic.addSubscription(sub);

    // IAM
    const policy = new iam.PolicyStatement({
      actions: ['sns:*'],
      resources: [
        topic.topicArn
      ],
    })
    fn.addToRolePolicy(policy);
  }
}