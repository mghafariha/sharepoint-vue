import { mapState } from 'vuex'
import SimpleColumn from './SimpleColumn'
import Custom from './Custom'
import Loading from './Loading'
import TwoSide from './TwoSide'


export default {
    components: { SimpleColumn, Custom, Loading, TwoSide },
    template: `
        <component :is="templateName" :columnsNum="columnsNum"/>
    `,
    computed: {
        ...mapState(['templateName', 'columnsNum'])
    }
}
