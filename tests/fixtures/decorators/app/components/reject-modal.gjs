import Component from '@ember/component';
import ModalDialog from 'my-components/components/modal-dialog';
import { action } from '@ember/object';
import { readOnly } from '@ember/object/computed';

export default class RejectModal extends Component {
  @action
  someAction() {}

  @readOnly('foo.bar')
  fooHasBar;

  <template>
    <ModalDialog
      @title="Foo"
      @showCloseButton={{this.fooHasBar}}
      @onClose={{this.someAction}}
    >
      <p>Bar</p>
    </ModalDialog>
  </template>
}