@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)@JsonSubTypes({
    @Type(value = SubTypeOne.class, name="subTypeOne"),
    @Type(value = SubTypeTwo.class, name="subTypeTwo")
})
public abstract class JsonTypeInfoTest {
	
}