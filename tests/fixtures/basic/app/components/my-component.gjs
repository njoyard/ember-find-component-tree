import Component from '@glimmer/component';
import Button from 'my-components/components/button';

export default class MyComponent extends Component {
  <template>
    <Button @label="Click me" />
  </template>
}